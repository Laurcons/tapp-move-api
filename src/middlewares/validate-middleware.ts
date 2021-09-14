import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate as cvValidate } from "class-validator";
import express from 'express';
import { asyncWrap } from '../async-wrap';

export default function validate<BodyT extends object, QueryT extends object, ParamsT extends object>(dto: {
    body?: ClassConstructor<BodyT>,
    query?: ClassConstructor<QueryT>,
    params?: ClassConstructor<ParamsT>
}) {
    return asyncWrap(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            dto.body && await validatePart(dto.body, req.body);
            dto.query && await validatePart(dto.query, req.query);
            dto.params && await validatePart(dto.params, req.params);
        } catch (err) {
            return next(err);
        }
        next();
    });
}

async function validatePart<PartT extends object>(type: ClassConstructor<PartT>, contents: any) {
    const instance = plainToClass(type, contents);
    const errors = await cvValidate(instance);
    if (errors.length > 0)
        throw errors[0];
}