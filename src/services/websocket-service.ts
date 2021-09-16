import http, { IncomingMessage } from "http";
import { Server } from "socket.io";
import ApiError from "../api-error";
import { JWTP } from "../jwt-promise";
import { Logger } from "../logger";
import { AdminAuthService } from "./admin-auth-service";

enum WebsocketEvents {
	"subscribe",
	"unsubscribe",
}

export abstract class WebsocketService {
	private _io!: Server;
	private adminAuthService = AdminAuthService.instance;
	private _logger = new Logger({ prefix: "s.io" });

	private static _instance: WebsocketService;
	public static get instance() {
		if (!this._instance) this._instance = new WebsocketServiceInstance();
		return this._instance;
	}

	attach(server: http.Server) {
		this._io = new Server({
			// allowRequest: async (req, next) => {
			//     try {
			//         await this.allowRequest(req);
			//     } catch (ex) {
			//         next(ex, false);
			//     }
			//     next(null, true);
			// },
			serveClient: true,
		});
        this._io
			.attach(server)
			.on("connection", (socket) => {
				this._logger.log(`Received connection from ${socket.client.request.socket.remoteAddress}`);
			});
	}

	private async allowRequest(req: IncomingMessage) {
		const regex = /^Bearer ([a-zA-Z0-9-_.]+)$/;
		const regexResult = regex.exec(req.headers.authorization ?? "");
		if (!regexResult) throw ApiError.invalidToken;
		const token = regexResult[1];
		// we use a TEMP variable here because i really want my 'jwt' to be
		//  a const, which it is only after the catch block
		let jwtTEMP;
		try {
			jwtTEMP = await JWTP.verify(token);
		} catch (err) {
			throw ApiError.invalidToken;
		}
		const jwt = jwtTEMP;
		this.adminAuthService.verifyToken(jwt);
	}
}
class WebsocketServiceInstance extends WebsocketService {}
