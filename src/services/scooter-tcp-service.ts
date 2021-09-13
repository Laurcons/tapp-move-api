import Config from "../environment";
import net, { createConnection } from "net";
import { Logger } from "../logger";
import { Queue } from "queue-typescript";
import { TypedEvent } from "../typed-event";
import {
	DecimalDegreesLocation,
	decimalMinutesToDecimalDegrees,
} from "../coord-convert";
import { EventEmitter } from "stream";
import { TypedEmitter } from "tiny-typed-emitter";

/** Currently 10 seconds */
const RESPONSE_TIMEOUT = 10 * 1000;

interface ScooterMessage {
	vendor: string;
	lockId: string;
	command: string;
	params: string[];
}
type ScooterMessageHandler = (msg: ScooterMessage) => void;

export interface ScooterStatusEvent {
	lockId: string;
	batteryLevel: number;
	isUnlocked: boolean;
	isCharging: boolean;
}

export interface ScooterLockStatusEvent {
	lockId: string;
	isUnlocked: boolean;
}

export interface ScooterLocationEvent {
	lockId: string;
	isFromTracking: boolean;
	location: [number, number];
}

interface ServiceEvents {
	scooterLockStatus: (data: ScooterLockStatusEvent) => void;
	scooterLocation: (data: ScooterLocationEvent) => void;
	scooterStatus: (data: ScooterStatusEvent) => void;
	lockIdStashNeeded: () => void;
}
class ServiceEventEmitter extends TypedEmitter<ServiceEvents> {}

interface CommandEvents {
	[key: string]: ScooterMessageHandler;
}
class CommandEventEmitter extends TypedEmitter<CommandEvents> {}

interface CommandMiddlewareEvents extends CommandEvents {}
class CommandMiddlewareEventEmitter extends TypedEmitter<CommandMiddlewareEvents> {}

export abstract class ScooterTcpService {
	private static _instance: ScooterTcpService | null;
	static get instance() {
		if (!this._instance) this._instance = new ScooterTcpServiceInstance();
		return this._instance;
	}

	private _sock = new net.Socket();
	private _logger: Logger | null = null;
	private _commandQueue = new CommandEventEmitter();
	private _commandMiddleware = new CommandMiddlewareEventEmitter();

	public events = new ServiceEventEmitter();

	async init(logger?: Logger) {
		this._logger = logger ?? null;
		if (Config.get("HAS_TCP") !== "true") {
			(this._logger || console).log(
				"TCP scooter interactivity is turned off\nTo turn scooter interactivity on, set env HAS_TCP to 'true'\nPlease note that attempting to interact with real scooters in this state will likely result in crashes"
					.yellow.underline
			);
			return;
		}
		// set up command middleware
		this._commandMiddleware
			.on("H0", (m) => this.handleH0(m))
			.on("D0", (m) => this.handleD0(m))
			.on("S6", (m) => this.handleS6(m))
			.on("L0", (m) => this.handleL0(m))
			.on("L1", (m) => this.handleL1(m));
		this._sock.setKeepAlive(true);
		this._sock.on("data", (b) => this.handleRawData(b));
		this._sock.on("close", (hadError) => {
			this._logger?.log(
				`Connection closed ${hadError ? "with error" : ""}`.red
			);
			this.connect();
		});
		this.connect();
	}

	private async connect() {
		this._logger?.log(`Connecting`.green);
		this._sock.connect({
			host: Config.get("TCP_HOST"),
			port: parseInt(Config.get("TCP_PORT")),
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
			if (!matchTEMP) {
				throw new Error("Invalid response from TCP");
			}
		} catch (ex) {
			this._logger?.log("Invalid message received: parsing aborted".red);
			return;
		}
		const match = matchTEMP as Required<RegExpExecArray>;
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

	private async handleH0(msg: ScooterMessage) {
		// log
		const [lockStatus, voltage, signal, power, charging] = msg.params;
		this._logger?.log(
			`H0 from ${msg.lockId}: `.magenta +
				`${lockStatus === "0" ? "unlocked" : "locked"} ` +
				`${voltage.substr(0, 1)}.${voltage.substr(1)}V ` +
				`${signal}/32 ` +
				`${power}% ` +
				`${charging === "0" ? "not-charging" : "charging"}`
		);
		this.events.emit("scooterStatus", {
			lockId: msg.lockId,
			batteryLevel: parseInt(power),
			isUnlocked: lockStatus === "0",
			isCharging: charging === "1",
		});
	}

	private handleS6(msg: ScooterMessage) {
		// log
		const [power, mode, speed, charging, voltage, , lockStatus, signal] =
			msg.params;
		const modeStr =
			mode === "1"
				? "low"
				: mode === "2"
				? "med"
				: mode === "3"
				? "high"
				: "?";
		this._logger?.log(
			`S6 from ${msg.lockId}: `.magenta +
				`${power}% ` +
				`${modeStr}-speed-mode ` +
				`${speed}kmh ` +
				`${charging === "1" ? "charging" : "not-charging"} ` +
				`${voltage.substr(0, 1)}.${voltage.substr(1)}V ` +
				`${lockStatus === "0" ? "unlocked" : "locked"} ` +
				`${signal}/32`
		);
		// push to scooter
		this.events.emit("scooterStatus", {
			lockId: msg.lockId,
			batteryLevel: parseInt(power),
			isUnlocked: lockStatus === "0",
			isCharging: charging === "1",
		});
	}

	private handleD0(msg: ScooterMessage) {
		const [, , validFlag1, latStr, , lonStr, , , , , , validFlag2] =
			msg.params;
		if (validFlag1 !== "A" || validFlag2 === "N") {
			this._logger?.log(
				"Scooter remarked that it doesn't know where it is"
			);
			return;
		}
		const coords = decimalMinutesToDecimalDegrees([
			[parseInt(latStr.substr(0, 2)), parseFloat(latStr.slice(2))],
			[parseInt(lonStr.substr(0, 3)), parseFloat(lonStr.slice(3))],
		]);
		this._logger?.log(`Scooter said it's at ${coords}`);
		// push to scooter
		this.events.emit("scooterLocation", {
			lockId: msg.lockId,
			isFromTracking: msg.params[0] === "1",
			location: coords,
		});
	}

	private handleL0(msg: ScooterMessage) {
		const [ isSuccess ] = msg.params;
		// 0 means it was successful
		if (isSuccess === "0") {
			this.events.emit("scooterLockStatus", {
				lockId: msg.lockId,
				isUnlocked: true
			});
		}
	}

	private handleL1(msg: ScooterMessage) {
		const [ isSuccess ] = msg.params;
		// 0 means it was successful
		if (isSuccess === "0") {
			this.events.emit("scooterLockStatus", {
				lockId: msg.lockId,
				isUnlocked: false
			});
		}
	}

	private handleParsedMessage(message: ScooterMessage) {
		// call middleware
		this._commandMiddleware.emit(message.command, message);
		// call handlers
		const key = message.lockId + message.command;
		this._commandQueue.emit(key, message);
	}

	private addToQueue(
		lockId: string,
		command: string,
		handler: ScooterMessageHandler
	) {
		const key = lockId + command;
		this._commandQueue.once(key, handler);
	}

	private async sendCommandAndWait(
		message: Omit<ScooterMessage, "vendor">,
		options?: { timeoutMs?: number }
	) {
		return new Promise<ScooterMessage>((resolve, reject) => {
			let isPending = true;
			this.addToQueue(message.lockId, message.command, (m) => {
				isPending = false;
				resolve(m);
			});
			setTimeout(() => {
				if (!isPending) return;
				reject();
				this._logger?.log(
					`Timeout while waiting for ${message.command} from ${message.lockId}`
						.red
				);
			}, options?.timeoutMs ?? RESPONSE_TIMEOUT);
			// don't await
			this.sendCommand(message);
		});
	}

	private async sendCommand(message: Omit<ScooterMessage, "vendor">) {
		return new Promise<void>((resolve, reject) => {
			const { params, lockId, command } = message;
			const paramsString =
				params.length === 0 ? "" : `,${params.join(",")}`;
			const cmdString = `*SCOS,LA,${lockId},${command}${paramsString}#\n`;
			if (!this._logger) throw "WHAT";
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
		for (const lockId of lockIds) {
			await this.sendCommandAndWait({
				command: "S6",
				lockId,
				params: [],
			}).catch(() => {});
			await this.sendCommandAndWait(
				{
					command: "D0",
					lockId,
					params: [],
				},
				{ timeoutMs: 60 * 1000 }
			).catch(() => {});
		}
	}

	private async beginLockingOp(lockId: string) {
		const userId = "1235";
		const timestamp = Date.now().toString().slice(0, -3);
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

	async modifyLights(
		lockId: string,
		options: { tail?: boolean; head?: boolean }
	) {
		const tail =
			options.tail === undefined ? "0" : options.tail ? "2" : "1";
		const head =
			options.head === undefined ? "0" : options.head ? "2" : "1";
		const response = await this.sendCommandAndWait({
			command: "S7",
			lockId,
			params: [head, "0", "0", tail],
		});
		return {
			head: response.params[0],
			tail: response.params[3],
		};
	}

	async requestLocationOnce(
		lockId: string
	): Promise<DecimalDegreesLocation | null> {
		const response = await this.sendCommandAndWait({
			command: "D0",
			lockId,
			params: [],
		});
		if (response.params[12] === "N") return null;
		const latStr = response.params[3];
		const lonStr = response.params[5];
		return decimalMinutesToDecimalDegrees([
			[parseInt(latStr.substr(0, 2)), parseFloat(latStr.slice(2))],
			[parseInt(lonStr.substr(0, 3)), parseFloat(lonStr.slice(3))],
		]);
	}

	async beginTrackPosition(lockId: string) {
		await this.sendCommand({
			command: "D1",
			lockId,
			params: ["5"], // seconds interval the scooter should send location at
		});
	}

	async endTrackPosition(lockId: string) {
		await this.sendCommand({
			command: "D1",
			lockId,
			params: ["0"],
		});
	}
}

class ScooterTcpServiceInstance extends ScooterTcpService {}
