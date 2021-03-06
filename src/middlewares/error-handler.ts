import { ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import ApiError from "../api-error";
import { Logger } from "../logger";

export default function handleErrors(logger?: Logger) {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
        
        const relationId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        if (!(err instanceof ApiError)) {
            logger?.log(`Relation id ${relationId}`);
            logger?.log(err);
        }

        if (err instanceof ApiError) {
            res.status(err.status).json({
                status: "error",
                code: err.code,
                message: err.message,
                relationId
            });
        } else if (err instanceof ValidationError) {
            res.status(422).json({
				status: "validation-error",
				details: err,
				relationId,
			});
        } else {
            res.status(400).json({
                status: "internal-error",
                relationId
            });
        }
        
    }
}