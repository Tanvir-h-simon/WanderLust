const Listing      = require("../models/listing");
const User         = require("../models/user");
const ExpressError = require("../utils/expressError");
const { cloudinary } = require("../cloudConfig");
const { geocode }  = require("../utils/geocoder");
const { logAction } = require("../utils/auditLogger");

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CATEGORY_TERMS = {
    beach:       "beach|coast|ocean|seaside|bay|shore|sand",
    city:        "city|downtown|urban|metro|new york|paris|london|tokyo|bangkok|dubai|singapore|sydney",
    mountains:   "mountain|alpine|highland|peak|summit|ridge|alps|himalaya|rockies|andes",
    cabins:      "cabin|cottage|lodge|chalet|retreat|woodland|treehouse|farmhouse",
    pools:       "pool|villa|resort|infinity",
    lake:        "lake|lakefront|lakeside|waterfront|fjord",
    desert:      "desert|sahara|dune|oasis|canyon",
    island:      "island|isle|tropical|maldive|caribbean|bali|hawaii",
    ski:         "ski|snow|glacier|nordic|whistler|aspen",
    rooms:       "room|studio|apartment|flat|condo",
    countryside: "countryside|rural|farm|vineyard|meadow|valley",
};

function buildQuery(reqQuery) {
    const query = {};
    const andConditions = [];

    if (reqQuery.location && reqQuery.location.trim() !== "") {
        const term = escapeRegex(reqQuery.location.trim());
        andConditions.push({
            $or: [
                { location: { $regex: term, $options: "i" } },
                { country:  { $regex: term, $options: "i" } },
                { title:    { $regex: term, $options: "i" } }
            ]
        });
    }

    if (reqQuery.country && reqQuery.country.trim() !== "") {
        query.country = { $regex: `^${escapeRegex(reqQuery.country.trim())}$`, $options: "i" };
    }

    const category = reqQuery.category || "";
    if (category && CATEGORY_TERMS[category]) {
        const keywordRegex = { $regex: CATEGORY_TERMS[category], $options: "i" };
        andConditions.push({
            $or: [
                { category: category },
                {
                    $and: [
                        { $or: [{ category: { $exists: false } }, { category: null }, { category: "" }] },
                        { $or: [
                            { title:       keywordRegex },
                            { location:    keywordRegex },
                            { country:     keywordRegex },
                            { description: keywordRegex },
                        ]}
                    ]
                }
            ]
        });
    }

    if (reqQuery.minPrice) query.price = { ...query.price, $gte: Number(reqQuery.minPrice) };
    if (reqQuery.maxPrice) query.price = { ...query.price, $lte: Number(reqQuery.maxPrice) };

    if (reqQuery.guests && Number(reqQuery.guests) > 0) {
        query.maxGuests = { $gte: Number(reqQuery.guests) };
    }

    if (andConditions.length > 0) query.$and = andConditions;
    return { query, category };
}

module.exports.index = async (req, res) => {
    const { query, category } = buildQuery(req.query);

    const found = await Listing.find(query).populate("reviews");
    const allListings = found.map(listing => {
        const obj = listing.toObject();
        obj.reviewCount = (obj.reviews && obj.reviews.length) || 0;
        obj.avgRating = obj.reviewCount
            ? obj.reviews.reduce((sum, r) => sum + r.rating, 0) / obj.reviewCount
            : 0;
        return obj;
    });
    const wishlistIds = req.user ? req.user.wishlist.map(id => id.toString()) : [];

    res.locals.showCategoryBar = true;
    res.render("listings/index.ejs", {
        allListings,
        searchQuery:    req.query.location || "",
        countryFilter:  req.query.country  || "",
        activeCategory: category,
        guests:         req.query.guests   || "",
        checkin:        req.query.checkin  || "",
        checkout:       req.query.checkout || "",
        wishlistIds
    });
};

module.exports.renderMap = async (req, res) => {
    const { query } = buildQuery(req.query);
    query["geometry.coordinates"] = { $size: 2 };

    const found = await Listing.find(query).select("title location country price image geometry avgRating reviewCount");
    const listings = found.map(l => l.toObject());

    const backQuery = new URLSearchParams(req.query).toString();
    res.render("listings/map.ejs", {
        listings,
        backQuery: backQuery ? "?" + backQuery : ""
    });
};

module.exports.mine = async (req, res) => {
    const found = await Listing.find({ owner: req.user._id }).populate("reviews");
    const myListings = found.map(listing => {
        const obj = listing.toObject();
        obj.reviewCount = (obj.reviews && obj.reviews.length) || 0;
        obj.avgRating = obj.reviewCount
            ? obj.reviews.reduce((sum, r) => sum + r.rating, 0) / obj.reviewCount
            : 0;
        return obj;
    });
    res.render("listings/mine.ejs", { myListings });
};

module.exports.renderNew = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.create = async (req, res) => {
    const { title, description, price, maxGuests, location, country, category } = req.body;

    if (!title || !description || !price || !location || !country) {
        throw new ExpressError("All fields are required", 400);
    }

    const image = req.file
        ? { url: req.file.path, filename: req.file.filename }
        : { url: req.body?.image?.url || req.body?.image || "", filename: "listingimage" };

    const geometry = await geocode(location, country);

    const newListing = new Listing({
        title, description, image,
        price, maxGuests, location, country,
        category: category || null,
        owner: req.user._id,
        geometry
    });
    await newListing.save();
    await logAction(req, "listing.created", "Listing", newListing._id, newListing.title);
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
};

module.exports.show = async (req, res) => {
    const { id } = req.params;
    const foundListing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "user" } })
        .populate("owner");

    if (!foundListing) throw new ExpressError("Listing not found", 404);
    res.render("listings/show.ejs", { listing: foundListing });
};

module.exports.renderEdit = async (req, res) => {
    const { id } = req.params;
    const foundListing = await Listing.findById(id);
    if (!foundListing) throw new ExpressError("Listing not found", 404);
    res.render("listings/edit.ejs", { listing: foundListing });
};

module.exports.update = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, maxGuests, location, country, category } = req.body;

    const geometry = await geocode(location, country);
    const updateData = { title, description, price, maxGuests, location, country, category: category || null };
    if (geometry) updateData.geometry = geometry;
    if (req.file) {
        const oldListing = await Listing.findById(id);
        if (oldListing?.image?.filename) {
            await cloudinary.uploader.destroy(oldListing.image.filename);
        }
        updateData.image = { url: req.file.path, filename: req.file.filename };
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedListing) throw new ExpressError("Listing not found", 404);
    await logAction(req, "listing.updated", "Listing", updatedListing._id, updatedListing.title, { fields: Object.keys(updateData) });
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroy = async (req, res) => {
    const { id } = req.params;
    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) throw new ExpressError("Listing not found", 404);
    if (deleted.image?.filename) {
        await cloudinary.uploader.destroy(deleted.image.filename);
    }
    await logAction(req, "listing.deleted", "Listing", deleted._id, deleted.title, { location: deleted.location, country: deleted.country });
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
};

module.exports.toggleWishlist = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const alreadyWishlisted = user.wishlist.some(wId => wId.equals(id));

    if (alreadyWishlisted) {
        await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: id } });
    } else {
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: id } });
    }

    res.json({ wishlisted: !alreadyWishlisted });
};
