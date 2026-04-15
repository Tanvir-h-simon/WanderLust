const mongoose = require("mongoose");
const initData = require("./data.js");
const listing = require("../models/listing.js");

main()
    .then(() => {
        console.log("Database connection successful");
        return seedDatabase();
    })
    .catch((err) => {
        console.error("Error:", err);
    });

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/WanderLustDB");
    console.log("Connected to MongoDB");
}

async function seedDatabase() {
    try {
        await listing.deleteMany({});
        console.log("Existing listings cleared");
        await listing.insertMany(initData.data);
        console.log("Database seeded with sample listings");
    } catch (err) {
        console.error("Error seeding database:", err);
    }
}