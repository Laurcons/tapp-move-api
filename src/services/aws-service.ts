import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Config from "../environment";
import { JWTP } from "../jwt-promise";

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

	async getSignedUrl(key: string) {
		return await getSignedUrl(this._s3, new GetObjectCommand({
			Bucket: Config.get("AWS_BUCKET"),
			Key: key
		}));
	}

	async createPresignedPost(key: string, contentType: string, jwtPayload: Record<string, any>) {
		const jwt = await JWTP.sign(jwtPayload, Config.get("JWT_SECRET"));
		const presignedPost = await createPresignedPost(this._s3, {
			Bucket: Config.get("AWS_BUCKET"),
			Key: key,
			Conditions: [
				[ "content-length-range", 0, 10 * 1024 * 1024 ] // max 10 MB
			],
			Expires: 10 * 60, // 10 minutes
			Fields: {
				"Content-Type": contentType,
				success_action_redirect:
					Config.get("API_URL") + `/uploads/confirm?payload=${jwt}`,
			}	
		});
		return presignedPost;
	}
}
class AwsServiceInstance extends AwsService {}
