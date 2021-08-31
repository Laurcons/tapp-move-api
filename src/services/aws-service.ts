import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import Config from "../environment";

export default abstract class AwsService {
    private _s3!: S3Client;

	private static _instance: AwsService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new AwsServiceInstance();
		return this._instance;
	}

	init() {
		this._s3 = new S3Client({
			credentials: {
				accessKeyId: Config.get("AWS_ACCESS_KEY_ID"),
				secretAccessKey: Config.get("AWS_SECRET_ACCESS_KEY"),
			},
			region: "eu-west-1",
		});
	}

    async uploadDriversLicense(userId: string, image: Express.Multer.File) {
		const key = `driverslicense-${userId}`;
		await this._s3.send(
			new PutObjectCommand({
				Bucket: Config.get("AWS_BUCKET"),
				Key: key,
				ContentType: image.mimetype,
				Body: image.buffer,
			})
		);
        return key;
    }
}
class AwsServiceInstance extends AwsService {}
