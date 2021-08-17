import dotenv from "dotenv";

export default class Config {
	static init() {
		dotenv.config();
	}

	static get(key: string): string {
		if (process.env[key]) {
			// this will never coalesce to "" but it barks at me if i don't put it
			return process.env[key] ?? "";
		}
		throw new Error(`Couldn't find environment variable ${key}`);
	}
}
