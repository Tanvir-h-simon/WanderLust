const AuditLog = require("../models/auditLog");

async function logAction(req, action, targetType, targetId, targetTitle, metadata = {}) {
    if (!req.user || req.user.role !== "admin") return;
    try {
        await AuditLog.create({
            actor: req.user._id,
            actorUsername: req.user.username,
            action,
            targetType,
            targetId,
            targetTitle,
            metadata,
            ip: req.ip
        });
    } catch (err) {
        console.error("Audit log error:", err.message);
    }
}

module.exports = { logAction };
