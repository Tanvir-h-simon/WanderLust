const Listing      = require("../models/listing");
const Review       = require("../models/reviews");
const ExpressError = require("../utils/expressError");
const { logAction } = require("../utils/auditLogger");

async function syncListingRating(listingId) {
    const listing = await Listing.findById(listingId).populate("reviews", "rating");
    if (!listing) return;
    const count = listing.reviews.length;
    const avg = count > 0
        ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
    await Listing.findByIdAndUpdate(listingId, {
        avgRating:   Math.round(avg * 10) / 10,
        reviewCount: count
    });
}

module.exports.create = async (req, res) => {
    const { id } = req.params;
    const listingToReview = await Listing.findById(id);
    if (!listingToReview) throw new ExpressError("Listing not found", 404);

    const { rating, comment } = req.body;
    const newReview = new Review({ rating, comment, listing: id, user: req.user._id });
    await newReview.save();

    listingToReview.reviews.push(newReview);
    await listingToReview.save();
    await syncListingRating(id);

    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroy = async (req, res) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId).populate("user", "username");
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    await syncListingRating(id);

    if (review) {
        const listing = await Listing.findById(id).select("title");
        await logAction(req, "review.deleted", "Review", review._id, `Review on "${listing?.title || id}"`, {
            reviewAuthor: review.user?.username,
            rating: review.rating,
            comment: review.comment?.substring(0, 100)
        });
    }

    req.flash("success", "Review deleted.");
    res.redirect(`/listings/${id}`);
};
