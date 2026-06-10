if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing  = require("../models/listing");
const { geocode } = require("../utils/geocoder");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    const dbUrl = process.env.MONGO_ATLAS_URL || "mongodb://127.0.0.1:27017/WanderLustDB";
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");

    const listings = await Listing.find({
        $or: [
            { geometry: { $exists: false } },
            { "geometry.coordinates": { $size: 0 } },
            { "geometry.coordinates": { $exists: false } }
        ]
    });

    console.log(`Found ${listings.length} listings without geometry. Starting geocoding...\n`);

    let success = 0;
    let failed  = 0;

    for (let i = 0; i < listings.length; i++) {
        const l = listings[i];
        const geometry = await geocode(l.location, l.country);

        if (geometry) {
            await Listing.findByIdAndUpdate(l._id, { geometry });
            success++;
            process.stdout.write(`\r[${i + 1}/${listings.length}] ✓ ${success} geocoded, ${failed} failed`);
        } else {
            failed++;
            process.stdout.write(`\r[${i + 1}/${listings.length}] ✗ ${success} geocoded, ${failed} failed  (${l.location}, ${l.country})`);
        }

        // Small delay to stay well within Mapbox rate limits
        await sleep(120);
    }

    console.log(`\n\nDone! ${success} geocoded, ${failed} could not be resolved.`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
