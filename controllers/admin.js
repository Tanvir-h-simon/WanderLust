const AuditLog = require("../models/auditLog");

const PAGE_SIZE = 50;

module.exports.renderAuditLog = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const filter = {};

    if (req.query.action) filter.action = req.query.action;

    const total = await AuditLog.countDocuments(filter);
    const logs  = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE);

    res.render("admin/audit-log.ejs", {
        logs,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
        total,
        actionFilter: req.query.action || ""
    });
};
