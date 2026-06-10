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
        return ensureAdmin().then(seedDatabase);
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

async function ensureAdmin() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const email    = process.env.ADMIN_EMAIL || "admin@wanderlust.com";

    if (!username || !password) {
        console.warn("ADMIN_USERNAME or ADMIN_PASSWORD not set — skipping admin creation.");
        return;
    }

    let admin = await User.findOne({ username });
    if (!admin) {
        const newAdmin = new User({ username, email, role: 'admin' });
        await User.register(newAdmin, password);
        console.log(`Admin user '${username}' created.`);
    } else if (admin.role !== 'admin') {
        await User.findByIdAndUpdate(admin._id, { role: 'admin' });
        console.log(`User '${username}' promoted to admin.`);
    } else {
        console.log(`Admin user '${username}' already exists.`);
    }
}

async function seedDatabase() {
    try {
        await Listing.deleteMany({});
        console.log("Existing listings cleared");

        const firstUser = await User.findOne({ role: 'admin' }) || await User.findOne({});
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
