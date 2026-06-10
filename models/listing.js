const mongoose = require("mongoose");
const Review = require("./reviews");
const schema = mongoose.Schema;

const listingSchema = new schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        filename: String,
        url: {
            type: String,
            default: "https://shorturl.at/Jp14Z"
        }
    },
    price: Number,
    maxGuests: {
        type: Number,
        default: 4,
        min: 1
    },
    location: String,
    country: String,
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number]  // [longitude, latitude]
        }
    },
    category: {
        type: String,
        enum: ['beach', 'city', 'mountains', 'cabins', 'pools', 'lake', 'island', 'desert', 'rooms', 'ski', 'countryside'],
        default: null
    },
    avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    }
});

// Middleware: Delete all reviews when listing is deleted
listingSchema.post("findOneAndDelete", async function (deletedListing) {
    if (deletedListing && deletedListing.reviews && deletedListing.reviews.length > 0) {
        await Review.deleteMany({ _id: { $in: deletedListing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
