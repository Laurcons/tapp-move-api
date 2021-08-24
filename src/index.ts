import express from "express";
import morgan from "morgan";
import "colors";
import { Logger } from "./logger";
import { mongoConnect } from "./database";
import Config from "./environment";
import appRouter from "./routes/app-router";
import handleErrors from "./middlewares/error-handler";
import handleNotFound from "./middlewares/not-found-handler";
import { setValidationLogger } from "./middlewares/validation-middleware";
import { inits3 } from "./aws";
import viewsRouter from "./routes/pages/pages-router";
import mustacheExpress from "mustache-express";

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

app.use(express.json());
app.use(morgan(Config.get("MORGAN_MODE")));

app.use("/api-v1", appRouter);

app.use(handleNotFound());
app.use(handleErrors(new Logger({prefix: "exception"})));

const expressLogger = new Logger({prefix: "express"});

(async function() {

    expressLogger.log("Application started");
    setValidationLogger(new Logger({ prefix: "joi" }));
    expressLogger.log("Connecting to database...");
    await mongoConnect();
    expressLogger.log("Initializing S3...");
    inits3();
    await listenAsync();
    expressLogger.log(`Listening on ${PORT}`.rainbow);

})();

function listenAsync() {
    return new Promise<void>((resolve) => {
        app.listen(PORT, resolve);
    })
}
