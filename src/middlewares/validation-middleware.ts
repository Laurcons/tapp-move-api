
import joi from "joi";
import { Request, Response, NextFunction } from "express";
import { Logger } from "../logger";

let logger: Logger | null = null;

export default function validate(schema: joi.Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.options({
            allowUnknown: true
        }).validate({
            body: req.body,
            params: req.params,
            query: req.query
        });
        if (result.error) {
            return next(result.error);
        }
        if (result.warning) {
            logger?.log(result.warning);
        }
        next();
    };
}

export function setValidationLogger(newLogger: Logger) {
    logger = newLogger;
}