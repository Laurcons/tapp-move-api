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

const app = express();

const PORT = process.env.PORT ?? 8000;

app.use(express.json());
app.use(morgan("dev"));

app.use("/api-v1", appRouter);

app.use(handleNotFound());
app.use(handleErrors(new Logger({prefix: "exception"})));

const expressLogger = new Logger({prefix: "express"});

(async function() {

    expressLogger.log("Application started");
    Config.init();
    setValidationLogger(new Logger({ prefix: "joi" }));
    await mongoConnect();
    expressLogger.log("Connected to database");
    await listenAsync();
    expressLogger.log(`Listening on ${PORT}`.rainbow);

})();

function listenAsync() {
    return new Promise<void>((resolve) => {
        app.listen(PORT, resolve);
    })
}
