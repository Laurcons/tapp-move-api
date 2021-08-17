import jwt from 'jsonwebtoken';

/**
 * The JWT object, but with promises
 */
export class JWTP {

    static verify(token: string, secretOrPublicKey: string, options?: jwt.VerifyOptions) {
        return new Promise<jwt.JwtPayload>((resolve, reject) => {
            jwt.verify(token, secretOrPublicKey, options, (err, decoded) => {
                if (err) return reject(err);
                if (decoded)
                    resolve(decoded);
                else reject(new Error());
            });
        });
    }

    static sign(payload: Record<string, any>, secretOrPrivateKey: string, options?: jwt.SignOptions) {
        return new Promise<string>((resolve, reject) => {
            const callback = (err: Error | null, decoded: string | undefined) => {
                if (err) return reject(err);
                if (decoded)
                    resolve(decoded);
                else reject(new Error());
            };
            if (options)
                jwt.sign(payload, secretOrPrivateKey, options, callback);
            else
                jwt.sign(payload, secretOrPrivateKey, callback);
        });
    }

    /**
     * Decodes a JWT. This method is synchronous.
     */
    static decode(token: string, options: jwt.DecodeOptions & { complete: true; }) {
        return jwt.decode(token, options);
    }
}