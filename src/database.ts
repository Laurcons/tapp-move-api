import mongoose from "mongoose";
import Config from "./environment";

export async function mongoConnect() {
	return mongoose.connect(Config.get("MONGO_URL"), {
        // idk it barks at me if i don't add these
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}
