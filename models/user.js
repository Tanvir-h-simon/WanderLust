const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose').default;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing"
    }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);