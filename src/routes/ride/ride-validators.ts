import Joi from "joi";

export const getCurrentValidator = Joi.object({
    query: Joi.object({
        location: Joi.string()
            .regex(/^[0-9.]+\,[0-9.]+/)
            .required()
    })
});

export const toggleLockValidator = Joi.object({
	body: Joi.object({
		lock: Joi.bool().required(),
	}),
});