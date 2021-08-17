import express from "express";
import morgan from "morgan";
import "colors";
import { Logger } from "./logger";

const app = express();

const PORT = 8000;

app.use(express.json());
app.use(morgan("dev"));

const expressLogger = new Logger({prefix: "express"});

(async function() {

    await listenAsync();
    expressLogger.log(`Listening on ${PORT}`.rainbow);

})();

function listenAsync() {
    return new Promise<void>((resolve) => {
        app.listen(PORT, resolve);
    })
}
