const joi = require('joi');

const listingSchema = joi.object({
    title: joi.string().required(),
    description: joi.string().required(),
    image: joi.string().uri().required(),
    price: joi.number().required().min(0),
    location: joi.string().required(),
    country: joi.string().required()
});

module.exports = { listingSchema };