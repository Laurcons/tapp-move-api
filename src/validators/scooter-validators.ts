
import Joi from "joi";

export const findNearValidator = Joi.object({
    query: Joi.object({
        location: Joi.string()
            .regex(/^[0-9.]+\,[0-9.]+$/),
    })
});

export const getIdValidator = Joi.object({
    params: Joi.object({
        code: Joi.string().length(4)
    })
});

export const startRideValidator = Joi.object({
    params: Joi.object({
        code: Joi.string().length(4).required()
    }),
    body: Joi.object({
        location: Joi.array()
            .length(2)
            .items(Joi.number())
    }),
    query: Joi.object({
        isNFC: Joi.string()
    })
}).xor("body.location", "query.isNFC");

export const pingValidator = Joi.object({
    params: Joi.object({
        code: Joi.string().length(4).required()
    }),
    body: Joi.object({
        location: Joi.array()
            .length(2)
            .items(Joi.number())
            .required()
    }),
});