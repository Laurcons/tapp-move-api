import Config from "./environment";
Config.init();

import express from "express";
import morgan from "morgan";
import "colors";
import { Logger } from "./logger";
import { mongoConnect } from "./database";
import appRouter from "./routes/app-router";
import handleErrors from "./middlewares/error-handler";
import handleNotFound from "./middlewares/not-found-handler";
import viewsRouter from "./routes/pages/pages-router";
import mustacheExpress from "mustache-express";
import { setAuthLogger } from "./middlewares/auth-middleware";
import cors from "cors";
import { ScooterTcpService } from "./services/scooter-tcp-service";
import AwsService from "./services/aws-service";
import { AdminAuthService } from "./services/admin-auth-service";
import EmailService from "./services/email-service";
import RideService from "./services/ride-service";
import ScooterService from "./services/scooter-service";
import SessionService from "./services/session-service";
import UserService from "./services/user-service";
import { WebsocketService } from "./services/websocket-service";
import http from "http";
import throttle from "./middlewares/throttle-middleware";
import { rawBodySaver } from "./raw-body-saver";

const app = express();
const httpServer = http.createServer(app);

// we don't use Config.get here because it might not exist:
//  it is only supplied by Heroku
const PORT = process.env.PORT ?? 8000;

const logger = new Logger({ prefix: "init" });

app.use(cors({
	credentials: true
}));
app.use(express.json({
	verify: rawBodySaver
}));
app.use(morgan(Config.get("MORGAN_MODE")));

// configure pages
app.engine("mst", mustacheExpress());
app.set("view engine", "mst");
app.set("views", "./src/routes/pages/views");
app.use("/pages", viewsRouter);

if (process.env.NODE_ENV !== "production") {
	app.disable("view cache");
	if (process.env.THROTTLING_MS) {
		logger.log(
			`Throttling is enabled! Every request will be delayed by ${process.env.THROTTLING_MS} ms`.yellow
		);
		app.use(throttle(parseInt(process.env.THROTTLING_MS)));
	}
}

app.use("/api-v1", appRouter);

app.use(handleNotFound());
app.use(handleErrors(new Logger({ prefix: "exception" })));

(async function () {

	logger.log("Application started");
	setAuthLogger(new Logger({ prefix: "auth" }));

	logger.log("Connecting to database...");
	await mongoConnect();

	logger.log("Initializing S3...");
	AwsService.instance.init();

	logger.log("Connecting to scooter TCP server...");
	await ScooterTcpService.instance.init(new Logger({ prefix: "TCP" }));

	logger.log("Creating service instances...");
	AdminAuthService.instance;
	AwsService.instance;
	EmailService.instance;
	RideService.instance;
	ScooterService.instance;
	SessionService.instance;
	WebsocketService.instance;
	UserService.instance;

	await listenAsync();
	logger.log(`Listening on ${PORT}`.rainbow);

	// logger.log("Attaching websocket...");
	// WebsocketService.instance.attach(httpServer);
	
	if (Config.get("HAS_TCP") === "true") {
		logger.log(`Sending scooter greetings...`);
		await ScooterTcpService.instance.sendGreetings();
	} else {
		logger.log("Scooter greetings were skipped");
	}
	logger.log("Initialization finished");
	
})();

function listenAsync() {
	return new Promise<void>((resolve) => {
		httpServer.listen(PORT, resolve);
	});
}
