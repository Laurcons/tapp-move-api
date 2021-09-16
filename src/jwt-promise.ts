import jwt from 'jsonwebtoken';
import Config from './environment';

export interface VerifyOptionsWithSecret extends jwt.VerifyOptions {
    secretKey?: string;
}
export interface SignOptionsWithSecret extends jwt.SignOptions {
    secretKey?: string;
}

/**
 * The JWT object, but with promises
 */
export class JWTP {

    static verify(token: string, options?: VerifyOptionsWithSecret) {
        const key = options?.secretKey ?? Config.get("JWT_SECRET");
        return new Promise<jwt.JwtPayload>((resolve, reject) => {
            jwt.verify(token, key, options, (err, decoded) => {
                if (err) return reject(err);
                if (decoded)
                    resolve(decoded);
                else reject(new Error());
            });
        });
    }

    static sign(payload: Record<string, any>, options?: SignOptionsWithSecret) {
        const key = options?.secretKey ?? Config.get("JWT_SECRET");
        return new Promise<string>((resolve, reject) => {
            const callback = (err: Error | null, decoded: string | undefined) => {
                if (err) return reject(err);
                if (decoded)
                    resolve(decoded);
                else reject(new Error());
            };
            if (options)
                jwt.sign(payload, key, options, callback);
            else
                jwt.sign(payload, key, callback);
        });
    }

    /**
     * Decodes a JWT. This method is synchronous.
     */
    static decode(token: string, options: jwt.DecodeOptions & { complete: true; }) {
        return jwt.decode(token, options);
    }
}