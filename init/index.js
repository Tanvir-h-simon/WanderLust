if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose       = require("mongoose");
const sampleListings = require("./sampleListings.js");
const Listing        = require("../models/listing.js");
const User           = require("../models/user.js");
const { geocode }    = require("../utils/geocoder.js");

const dbUrl = process.env.MONGO_ATLAS_URL || "mongodb://127.0.0.1:27017/WanderLustDB";

main()
    .then(() => {
        console.log("Database connection successful");
        return seedDatabase();
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

async function seedDatabase() {
    try {
        await Listing.deleteMany({});
        console.log("Existing listings cleared");

        const firstUser = await User.findOne({});
        const listings = [];
        for (const l of sampleListings) {
            const geometry = await geocode(l.location, l.country);
            listings.push({
                ...l,
                maxGuests: l.maxGuests || (l.price >= 3000 ? 8 : l.price >= 1500 ? 6 : 4),
                owner: firstUser ? firstUser._id : undefined,
                geometry: geometry || { type: "Point", coordinates: [] }
            });
            await new Promise(r => setTimeout(r, 120));
        }

        await Listing.insertMany(listings);
        console.log(
            `Seeded ${listings.length} listings` +
            (firstUser ? ` (owner: ${firstUser.username})` : " (no owner — create a user first)")
        );
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await mongoose.disconnect();
    }
}
