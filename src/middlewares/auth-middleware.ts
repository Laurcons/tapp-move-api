import { JWTP } from './../jwt-promise';

import { Request, Response, NextFunction } from "express";
import SessionService from "../services/session-service";
import AuthenticationError from '../errors/authentication-error';
import { asyncWrap } from '../async-wrap';
import Config from '../environment';
import ApiError from '../errors/api-error';

export default function withAuthentication(type: "user" | "admin") {
    return asyncWrap(async (req: Request, res: Response, next: NextFunction) => {
        const sessionService = new SessionService();
        // find the jwt
        if (!req.headers.authorization)
            throw new AuthenticationError("invalid-header");
        const parts = req.headers.authorization.split(' ');
        if (parts.length !== 2)
            throw new AuthenticationError("invalid-header");
        const token = parts[1];
        // decode the jwt
        let jwtTEMP;
        try {
            jwtTEMP = await JWTP.verify(token, Config.get("AUTH_SECRET"));
        } catch (err) {
            throw new AuthenticationError("invalid-token");
        }
        const jwt = jwtTEMP;
        const userId = jwt.sub;
        if (!userId)
            throw new AuthenticationError("invalid-token");
        // now find the user
        if (type === "user") {
            const session = await sessionService.findSessionForUser(userId);
            if (!session || session.expires.getTime() < Date.now()) {
                throw new AuthenticationError("invalid-session");
            }
            // everything should be good now
            req.session = session;
            next();
        } else {
            throw new ApiError(500, "not-implemented");
        }
    });
}