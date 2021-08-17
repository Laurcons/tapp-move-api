import express from "express";
import morgan from "morgan";
import "colors";
import { Logger } from "./logger";
import { mongoConnect } from "./database";
import Config from "./environment";

const app = express();

const PORT = 8000;

app.use(express.json());
app.use(morgan("dev"));

const expressLogger = new Logger({prefix: "express"});

(async function() {

    expressLogger.log("Application started");
    Config.init();
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
