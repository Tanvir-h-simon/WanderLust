const express    = require("express");
const router     = express.Router({ mergeParams: true }); // gives access to :id from parent route
const wrapAsync  = require("../utils/wrapAsync");
const controller = require("../controllers/reviews");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");

router.post("/",              isLoggedIn, validateReview, wrapAsync(controller.create));
router.delete("/:reviewId",   isLoggedIn, isReviewAuthor, wrapAsync(controller.destroy));

module.exports = router;
