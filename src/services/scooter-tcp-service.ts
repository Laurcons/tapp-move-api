import Config from "../environment";
import net, { createConnection } from "net";
import { Logger } from "../logger";
import { Queue } from "queue-typescript";
import { TypedEvent } from "../typed-event";

export interface ScooterMessage {
	vendor: string;
	lockId: string;
	command: string;
	params: string[];
}
export type MessageHandler = (msg: ScooterMessage) => void;

export interface ScooterNeedsUpdateEvent {
    lockId: string;
    batteryLevel: number;
    isUnlocked: boolean;
};

export abstract class ScooterTcpService {
	private static _instance: ScooterTcpService | null;
	static get instance() {
		if (!this._instance) {
			this._instance = new ScooterTcpServiceInstance();
		}
		return this._instance;
	}

	private _sock = new net.Socket();
	private _logger: Logger | null = null;
	/** An array of ONCE event handlers attached to specific lockids and commands from the server */
	private _eventQueue: Record<string, Queue<MessageHandler>> = {};

    public onScooterNeedsUpdate = new TypedEvent<ScooterNeedsUpdateEvent>();

	async init(logger?: Logger) {
		this._logger = logger ?? null;
		await this.connectInSock();
	}

	private async connectInSock() {
		this._sock = await this.createConnection();
		this._sock.setKeepAlive(true);
		this._sock.on("data", (b) => this.handleRawData(b));
		this._sock.on("close", (hadError) => {
			this._logger?.log(
				`Connection closed ${hadError ? "with error" : ""}`.red
			);
            this.connectInSock();
		});
	}

    private createConnection() {
        this._logger?.log("Creating connection".green);
		return new Promise<net.Socket>((resolve) => {
            const conn: net.Socket = createConnection(
				{
					host: Config.get("TCP_HOST"),
					port: parseInt(Config.get("TCP_PORT")),
				},
				() => resolve(conn)
			);
		});
    }

	private handleRawData(data: Buffer) {
		this._logger?.log("RECV".blue, data.toString("ascii").slice(0, -1));
		// decodes a message like *SCOR, OM, 123456789012345, L0, 123, 123, 123#\n
		// puts OM into 'vendor', 123456789012345 into 'lockId', L0 into 'cmd' and ", 123, 123, 123" into 'params'
		const parser =
			/\*SCOR\,\s*(?<vendor>[A-Z]{2})\,\s*(?<lockId>[0-9]{15})\,\s*(?<cmd>[A-Z0-9]{2})(?<params>(\,[A-Za-z0-9.]*)*)\#\n/;
        let matchTEMP;
        try {
		    matchTEMP = parser.exec(data.toString("ascii"));
        } catch (ex) {
            this._logger?.log("Invalid message received: parsing aborted".red);
        }
        const match = matchTEMP;
		if (!match || !match.groups) {
			throw new Error("Invalid response from TCP");
		}
		const vendor = match.groups["vendor"];
		const lockId = match.groups["lockId"];
		const command = match.groups["cmd"];
		const paramsRaw = match.groups["params"];
		const params = paramsRaw.split(",").slice(1); // ignore first element since it's empty since the string starts with a comma
		this.handleParsedMessage({
			vendor,
			lockId,
			params,
			command,
		});
	}

	private async handleHeartbeat(msg: ScooterMessage) {
		// log
		const [lockStatus, voltage, signal, power, charging] = msg.params;
		this._logger?.log(
			`H0 from ${msg.lockId}: `.blue +
				`${lockStatus === "0" ? "unlocked" : "locked"} ` +
				`${voltage.slice(0, -2)}.${voltage.slice(1)}V ` +
				`${signal}/32 ` +
				`${power}% ` +
				`${charging === "0" ? "not-charging" : "charging"}`
		);
        this.onScooterNeedsUpdate.emit({ 
			lockId: msg.lockId,
			batteryLevel: parseInt(msg.params[0]),
			isUnlocked: msg.params[6] === "0",
		});
	}

	private handleParsedMessage(message: ScooterMessage) {
		if (message.command === "H0")
			// don't await
			this.handleHeartbeat(message);
		// call handlers
		const key = message.lockId + message.command;
		const handlers = this._eventQueue[key];
		if (handlers) {
			while (handlers.length !== 0) {
				const handler = handlers.dequeue();
				handler(message);
			}
		}
	}

	private addToQueue(
		lockId: string,
		command: string,
		handler: MessageHandler
	) {
		const key = lockId + command;
		if (!Object.keys(this._eventQueue).includes(key))
			this._eventQueue[key] = new Queue<MessageHandler>();
		this._eventQueue[key].enqueue((m) => handler(m));
	}

	private async sendCommandAndWait(message: Omit<ScooterMessage, "vendor">) {
		return new Promise<ScooterMessage>((resolve) => {
            this.addToQueue(message.lockId, message.command, (m) => resolve(m));
            // don't await
			this.sendCommand(message);
		});
	}

	private async sendCommand(message: Omit<ScooterMessage, "vendor">) {
		return new Promise<void>((resolve, reject) => {
            const { params, lockId, command } = message;
            const paramsString = params.length === 0 ? "" : `,${params.join(",")}`;
            const cmdString = `*SCOS,LA,${lockId},${command}${paramsString}#\n`;
            if (!this._logger)
                throw "WHAT";
            this._logger?.log("SEND".red, cmdString.slice(0, -1));
			this._sock.write(cmdString, "ascii", (err) => {
				if (err) return reject(err);
                resolve();
			});
		});
	}

	async sendGreetings() {
		// const lockIds = await this.scooterService.getAllLockIds();
		const lockIds = ["867584033774352"];
		const promises = lockIds.map((lockId) => {
			return this.sendCommandAndWait({
				command: "S6",
				lockId,
				params: [],
			}).then((msg) => {
                this.onScooterNeedsUpdate.emit({
                    lockId: msg.lockId,
                    batteryLevel: parseInt(msg.params[0]),
                    isUnlocked: msg.params[6] === "0",
                });
			});
		});
		await Promise.all(promises);
	}

    private async beginLockingOp(lockId: string) {
        const userId = "1235";
		const timestamp = Date.now().toString().slice(-5);
		const response = await this.sendCommandAndWait({
			command: "R0",
			lockId,
			params: ["0", "20", userId, timestamp],
		});
		return {
			opkey: response.params[1],
			userId,
			timestamp,
		};
    }

	async unlockScooter(lockId: string) {
        const { opkey, userId, timestamp } = await this.beginLockingOp(lockId);
		const response = await this.sendCommandAndWait({
			command: "L0",
			lockId,
			params: [opkey, userId, timestamp],
		});
		if (response.params[0] !== "0") {
			throw new Error("Error while unlocking scooter");
		}
		// end
		await this.sendCommand({
			command: "L0",
			lockId,
			params: [],
		});
	}

    /** Returns "cycling time" */
    async lockScooter(lockId: string) {
        const { opkey } = await this.beginLockingOp(lockId);
		const response = await this.sendCommandAndWait({
			command: "L1",
			lockId,
			params: [opkey],
		});
		await this.sendCommand({
			command: "L1",
			lockId,
			params: [],
		});
        return response.params[3];
    }

	async pingScooter(lockId: string) {
		const response = await this.sendCommandAndWait({
			command: "V0",
			lockId,
			params: ["2"],
		});
		if (response.params[0] === "2") return true;
		return false;
	}

    async modifyLights(lockId: string, options: { tail?: boolean; head?: boolean }) {
        const tail =
			options.tail === undefined ? "0" : options.tail ? "2" : "1";
        const head =
			options.head === undefined ? "0" : options.head ? "2" : "1";
        const response = await this.sendCommandAndWait({
            command: "S7",
            lockId,
            params: [head, "0", "0", tail]
        });
        return {
            head: response.params[0],
            tail: response.params[3]
        };
    }
}

class ScooterTcpServiceInstance extends ScooterTcpService {}