import mongoose from "mongoose";
import Config from "./environment";

export async function mongoConnect() {
    mongoose.set("useNewUrlParser", true);
	mongoose.set("useFindAndModify", false);
	mongoose.set("useCreateIndex", true);
	mongoose.set("useUnifiedTopology", true);
	return mongoose.connect(Config.get("MONGO_URL"), {
        // idk it barks at me if i don't add these
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}
