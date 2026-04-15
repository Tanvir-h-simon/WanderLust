const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/expressError");
const {listingSchema} = require("./models/schema");

main()
    .then(() => {
        console.log("Database connection successful");
    }) .catch((err) => {
        console.error("Database connection error:", err);
    });

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/WanderLustDB");
    // console.log("Connected to MongoDB");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));


async function normalizeImageUrl(url) {
    // Default timeout of 5 seconds
    const timeoutMs = 5000;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.url && /^https?:\/\/images\.unsplash\.com\//i.test(response.url)) {
            return response.url;
        }
    } catch (err) {
        if (err.name === "AbortError") {
            console.warn(`Image URL validation timeout (${timeoutMs}ms) for: ${url}`);
        } else {
            console.warn(`Could not resolve image URL: ${err.message}`);
        }
    }

    return url;
}

app.get('/', wrapAsync(async (req, res) => {
    const featuredListings = await listing.find({}).limit(12);
    res.render("pages/home.ejs", { featuredListings });
}));

// app.get("/testListing", async (req, res) => {
//     let sampleListing = new listing({
//         title: "My home",
//         description: "A cozy place to stay",
//         image: "",
//         price: 100,
//         location: "New York",
//         country: "USA"
//     });
//     await sampleListing.save();
//     console.log("Sample listing saved to database");
//     res.send("Sample listing created and saved to database");
// });

const validateListing = (req, res, next) => {
    try {
        const { error } = listingSchema.validate(req.body);
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(", ");
            return next(new ExpressError(`Validation Error: ${errorMessages}`, 400));
        }
        next();
    } catch (err) {
        next(err);
    }
};


// Index Route: Display all listings
app.get("/listings", wrapAsync(async (req, res) => {
    let query = {};
    
    // Filter by location (if provided)
    if (req.query.location && req.query.location.trim() !== "") {
        query.location = { $regex: req.query.location, $options: "i" };
    }
    
    const allListings = await listing.find(query);
    res.render("listings/index.ejs", { allListings, searchQuery: req.query.location || "" });
}));

// New Route: Display form to create a new listing
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Create Route: Handle form submission to create a new listing
app.post("/listings", validateListing, wrapAsync(async (req, res) => {
    const { title, description, price, location, country } = req.body;
    
    if (!title || !description || !price || !location || !country) {
        throw new ExpressError("All fields are required", 400);
    }
    
    const imageUrl = await normalizeImageUrl(req.body?.image?.url || req.body?.image || "");
    const newListing = new listing({
        title,
        description,
        image: {
            filename: "listingimage",
            url: imageUrl
        },
        price,
        location,
        country
    });
    await newListing.save();
    res.redirect("/listings");
}));

// Show Route: Display details of a specific listing
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const foundListing = await listing.findById(id);
    
    if (!foundListing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    res.render("listings/show.ejs", { listing: foundListing });
}));

// Edit Route: Display form to edit an existing listing
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const foundListing = await listing.findById(id);
    
    if (!foundListing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    res.render("listings/edit.ejs", { listing: foundListing });
}));

// Update Route: Handle form submission to update an existing listing
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const { title, description, price, location, country } = req.body;
    
    const imageUrl = await normalizeImageUrl(req.body?.image?.url || req.body?.image || "");
    const updatedListing = await listing.findByIdAndUpdate(id, {
        title,
        description,
        image: {
            filename: "listingimage",
            url: imageUrl
        },
        price,
        location,
        country
    }, { new: true });
    
    if (!updatedListing) {
        throw new ExpressError("Listing not found", 404);
    }
    res.redirect(`/listings/${id}`);
}));

// Delete Route: Handle deletion of a listing
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const deletedListing = await listing.findByIdAndDelete(id);
    
    if (!deletedListing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    res.redirect("/listings");
}));

app.use((req, res) => {
    throw new ExpressError("Page not found!", 404);
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Internal Server Error" } = err;
    res.status(statusCode).render("layouts/error.ejs", { statusCode, message }).catch(() => {
        res.status(statusCode).send(`<h1>${statusCode}</h1><p>${message}</p>`);
    });
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});