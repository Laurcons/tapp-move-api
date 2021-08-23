import { S3Client } from "@aws-sdk/client-s3";
import Config from "./environment";

let _s3: S3Client | undefined;

export function inits3() {
	_s3 = new S3Client({
		credentials: {
			accessKeyId: Config.get("AWS_ACCESS_KEY_ID"),
			secretAccessKey: Config.get("AWS_SECRET_ACCESS_KEY"),
		},
		region: "eu-west-1",
	});
}

export function s3() {
	if (!_s3) throw new Error("S3 not initialized");
	return _s3;
}
