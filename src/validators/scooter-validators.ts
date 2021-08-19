
import { Joi } from "express-validation";

export const findNearValidator = {
    query: Joi.object({
        location: Joi.string()
            .regex(/^[0-9.]+\,[0-9.]+$/),
    })
};

export const getIdValidator = {
    params: Joi.object({
        code: Joi.string().length(4)
    })
};