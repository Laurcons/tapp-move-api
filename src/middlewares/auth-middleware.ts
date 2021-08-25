import { JWTP } from './../jwt-promise';

import { Request, Response, NextFunction } from "express";
import SessionService from "../services/session-service";
import ApiError from '../errors/api-error';
import { asyncWrap } from '../async-wrap';
import Config from '../environment';
import { Logger } from '../logger';

let _logger: Logger | null = null;

export default function authenticate(type: "user" | "admin", options?: { withPassword?: boolean; }) {
    return asyncWrap(async (req: Request, res: Response, next: NextFunction) => {
        // TODO: update exception handling to newer standards
        const sessionService = new SessionService();
        const regex = /^Bearer ([a-zA-Z0-9-_.]+)$/;
        const regexResult = regex.exec(req.headers.authorization ?? "");
        if (!regexResult)
            throw ApiError.invalidToken;
        const token = regexResult[1];
        // decode the jwt
        // we use a TEMP variable here because i really want my 'jwt' to be
        //  a const, which it is only after the catch block
        let jwtTEMP;
        try {
            jwtTEMP = await JWTP.verify(token, Config.get("AUTH_SECRET"));
        } catch (err) {
            throw ApiError.invalidToken;
        }
        const jwt = jwtTEMP;
        const userId = jwt.sub;
        if (!userId)
            throw ApiError.invalidToken;
        // now find the user
        if (type === "user") {
            const session = await sessionService.findSessionForUser(userId, options?.withPassword ?? false);
            if (!session || session.expires.getTime() < Date.now()) {
                throw ApiError.invalidToken;
            }
            // everything should be good now
            _logger?.log(`User ${session.user.username} token ..${token.substr(-5)}`);
            req.session = session;
            next();
        } else {
            throw new ApiError(500, "not-implemented");
        }
    });
}

export function setAuthLogger(logger?: Logger) {
    _logger = logger ?? null;
}