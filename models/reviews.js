const mongoose = require('mongoose');
const schema = mongoose.Schema;

const reviewSchema = new schema({
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        minlength: [10, 'Comment must be at least 10 characters'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    image: {
        filename: String,
        url: {
            type: String,
            match: [/^https?:\/\//, 'Image URL must be a valid HTTP(S) URL']
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Review", reviewSchema);