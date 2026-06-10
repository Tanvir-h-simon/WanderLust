const joi = require("joi");

const listingSchema = joi
    .object({
        title: joi.string().required(),
        description: joi.string().required(),
        // image is handled by multer (req.file), not req.body
        // image: joi.alternatives().try(
        //     joi.object({ url: joi.string().uri().required(), filename: joi.string().optional() }),
        //     joi.string().uri()
        // ).required(),
        image: joi
            .alternatives()
            .try(
                joi.object({
                    url: joi.string().uri().optional(),
                    filename: joi.string().optional(),
                }),
                joi.string().uri()
            )
            .optional(),
        price: joi.number().required().min(0),
        maxGuests: joi.number().integer().min(1).optional(),
        location: joi.string().required(),
        country: joi.string().required(),
        category: joi.string().valid('beach', 'city', 'mountains', 'cabins', 'pools', 'lake', 'island', 'desert', 'rooms', 'ski', 'countryside').optional().allow(null, ''),
    })
    .required();

const reviewSchema = joi.object({
    rating: joi.number().required().integer().min(1).max(5).messages({
        "number.base": "Rating must be a number",
        "number.integer": "Rating must be a whole number",
        "number.min": "Rating must be at least 1 star",
        "number.max": "Rating cannot exceed 5 stars",
        "any.required": "Rating is required"
    }),
    comment: joi.string().required().min(10).max(500).messages({
        "string.min": "Review must be at least 10 characters",
        "string.max": "Review cannot exceed 500 characters",
        "any.required": "Review comment is required"
    }),
    image: joi
        .object({
            url: joi.string().uri().optional().messages({
                "string.uri": "Image URL must be a valid URL"
            }),
            filename: joi.string().optional()
        })
        .optional()
        .allow(null, '')
});

module.exports = { listingSchema, reviewSchema };