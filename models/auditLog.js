const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    actorUsername: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ["listing.created", "listing.updated", "listing.deleted", "review.deleted"]
    },
    targetType: {
        type: String,
        required: true,
        enum: ["Listing", "Review"]
    },
    targetId: mongoose.Schema.Types.ObjectId,
    targetTitle: String,
    metadata: mongoose.Schema.Types.Mixed,
    ip: String
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
