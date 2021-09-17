import { NextFunction, Request, Response } from "express";
import ApiError from '../api-error';
import { asyncWrap } from '../async-wrap';
import { Logger } from '../logger';
import { AdminAuthService } from '../services/admin-auth-service';
import SessionService from "../services/session-service";
import { JWTP } from './../jwt-promise';


let _logger: Logger | null = null;

export default function authenticate(type: "user" | "admin", options?: { withPassword?: boolean; }) {
    return asyncWrap(async (req: Request, res: Response, next: NextFunction) => {
        // TODO: update exception handling to newer standards
        const sessionService = SessionService.instance;
        const adminAuthService = AdminAuthService.instance;
        const regex = /^Bearer ([a-zA-Z0-9-_.]+)$/;
        let regexResultTEMP;
        try {
            regexResultTEMP = regex.exec(req.headers.authorization ?? "");
        } catch (ex) {
            throw ApiError.users.invalidToken;
        }
        const regexResult = regexResultTEMP;
        if (!regexResult)
            throw ApiError.users.invalidToken;
        const token = regexResult[1];
        // decode the jwt
        // we use a TEMP variable here because i really want my 'jwt' to be
        //  a const, which it is only after the catch block
        let jwtTEMP;
        try {
            jwtTEMP = await JWTP.verify(token);
        } catch (err) {
            throw ApiError.users.invalidToken;
        }
        const jwt = jwtTEMP;
        const userId = jwt.sub;
        if (!userId)
            throw ApiError.users.invalidToken;
        // now find the user
        if (type === "user") {
            const session = await sessionService.findSessionForUserJwt(token, options?.withPassword ?? false);
            if (!session || session.expires.getTime() < Date.now()) {
                throw ApiError.users.invalidToken;
            }
            // everything should be good now
            _logger?.log(`User ${session.user.username} token ...${token.substr(-5)}`);
            req.session = session;
            next();
        } else if (type === "admin") {
            const session = await adminAuthService.verifyToken(jwt, options);
            if (!session || session.expires.getTime() < Date.now()) {
				throw ApiError.users.invalidToken;
			}
            _logger?.log(`Admin ${session.admin.email} token ...${token.substr(-5)}`);
            req.session = session;
            next();
        }
    });
}

export function setAuthLogger(logger?: Logger) {
    _logger = logger ?? null;
}