import { Request, Response, NextFunction } from "express"
import ApiError from "./errors/api-error";
import BodyApiError from "./errors/body-api-error"
import { Logger } from "./logger";

export default function withErrorHandling(logger?: Logger) {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
        const relationId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        logger?.log(`Caught error: ${err}`);
        if (err instanceof BodyApiError) {
            res.status(err.status).json({
                status: "body-error",
                field: err.field,
                code: err.code,
                message: err.message,
                relationId
            });
        } else if (err instanceof ApiError) {
            res.status(err.status).json({
                status: "error",
                code: err.code,
                message: err.message,
                relationId
            });
        } else {
            res.status(500).json({
                status: "internal-error",
                relationId
            })
        }
    }
}