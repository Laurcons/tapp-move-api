import express from "express";
import morgan from "morgan";
import "colors";
import { Logger } from "./logger";
import { mongoConnect } from "./database";
import Config from "./environment";
import appRouter from "./routes/app-router";
import handleErrors from "./middlewares/error-handler";
import handleNotFound from "./middlewares/not-found-handler";
import viewsRouter from "./routes/pages/pages-router";
import mustacheExpress from "mustache-express";
import { setAuthLogger } from "./middlewares/auth-middleware";
import cors from "cors";
import { ScooterTcpService } from "./services/scooter-tcp-service";
import AwsService from "./services/aws-service";

Config.init();

const app = express();

// we don't use Config.get here because it might not exist:
//  it is only supplied by Heroku
const PORT = process.env.PORT ?? 8000;

// configure pages
app.engine("mst", mustacheExpress());
app.set("view engine", "mst");
app.set("views", "./src/routes/pages/views");
app.use("/pages", viewsRouter);
if (process.env.NODE_ENV !== "production")
    app.disable("view cache");

app.use(cors());
app.use(express.json());
app.use(morgan(Config.get("MORGAN_MODE")));

app.use("/api-v1", appRouter);

app.use(handleNotFound());
app.use(handleErrors(new Logger({prefix: "exception"})));

const logger = new Logger({prefix: "init"});

(async function() {

    logger.log("Application started");
    setAuthLogger(new Logger({ prefix: "auth" }));
    logger.log("Connecting to database...");
    await mongoConnect();
    logger.log("Initializing S3...");
    AwsService.instance.init();
    logger.log("Connecting to scooter TCP server...");
    await ScooterTcpService.instance.init(new Logger({ prefix: "TCP" }));
    await listenAsync();
    logger.log(`Listening on ${PORT}`.rainbow);
    logger.log(`Sending scooter greetings...`);
    await ScooterTcpService.instance.sendGreetings();
    logger.log("Initialization successful");

})();

function listenAsync() {
    return new Promise<void>((resolve) => {
        app.listen(PORT, resolve);
    })
}
