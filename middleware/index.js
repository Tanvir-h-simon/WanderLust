const ExpressError = require("../utils/expressError");
const wrapAsync   = require("../utils/wrapAsync");
const Listing     = require("../models/listing");
const Review      = require("../models/reviews");
const { listingSchema, reviewSchema } = require("../models/schema");

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be logged in to do that.");
    res.redirect("/login");
};

const saveRedirectUrl = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

const isOwner = wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const foundListing = await Listing.findById(id);
    if (!foundListing) throw new ExpressError("Listing not found", 404);
    if (!foundListing.owner || !foundListing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that.");
        return res.redirect(`/listings/${id}`);
    }
    next();
});

const isReviewAuthor = wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) throw new ExpressError("Review not found", 404);
    if (!review.user || !review.user.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that.");
        return res.redirect(`/listings/${id}`);
    }
    next();
});

const validateListing = (req, res, next) => {
    try {
        const { error } = listingSchema.validate(req.body);
        if (error) {
            const msg = error.details.map(d => d.message).join(", ");
            return next(new ExpressError(`Validation Error: ${msg}`, 400));
        }
        next();
    } catch (err) {
        next(err);
    }
};

const validateReview = (req, res, next) => {
    try {
        const { error } = reviewSchema.validate(req.body);
        if (error) {
            const msg = error.details.map(d => d.message).join(", ");
            return next(new ExpressError(`Review Validation Error: ${msg}`, 400));
        }
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { isLoggedIn, saveRedirectUrl, isOwner, isReviewAuthor, validateListing, validateReview };
