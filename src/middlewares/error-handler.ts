import { Request, Response, NextFunction } from "express"
import { ValidationError as ValidationErrorJoi } from "joi";
import { ValidationError as ValidationErrorDTO } from "class-validator";
import ApiError from "../errors/api-error";
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
        } else if (err instanceof ValidationErrorJoi) {
            res.status(422).json({
                status: "validation-error[joi]",
                details: err.details,
                relationId
            });
        } else if (err instanceof ValidationErrorDTO) {
            res.status(422).json({
				status: "validation-error[dto]",
				details: err,
				relationId,
			});
        } else {
            res.status(500).json({
                status: "internal-error",
                relationId
            })
        }
        
    }
}