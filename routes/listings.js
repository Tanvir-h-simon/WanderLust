const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const controller = require("../controllers/listings");
const { isLoggedIn, isOwner, validateListing } = require("../middleware");
const { parser } = require("../cloudConfig");

router.get("/", wrapAsync(controller.index));
router.get("/map", wrapAsync(controller.renderMap));
router.get("/new", isLoggedIn, controller.renderNew);
router.get("/mine", isLoggedIn, wrapAsync(controller.mine));
router.post("/", isLoggedIn, parser.single("image"), validateListing, wrapAsync(controller.create));
router.post("/:id/wishlist", isLoggedIn, wrapAsync(controller.toggleWishlist));
router.get("/:id", wrapAsync(controller.show));
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(controller.renderEdit));
router.put("/:id", isLoggedIn, isOwner, parser.single("image"), validateListing, wrapAsync(controller.update));
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(controller.destroy));

module.exports = router;