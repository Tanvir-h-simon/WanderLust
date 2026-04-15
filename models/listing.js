const mongoose = require("mongoose");
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
    location: String,
    country: String
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;