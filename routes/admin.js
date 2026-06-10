const express    = require("express");
const router     = express.Router();
const wrapAsync  = require("../utils/wrapAsync");
const controller = require("../controllers/admin");
const { isLoggedIn, isAdmin } = require("../middleware");

router.get("/audit-log", isLoggedIn, isAdmin, wrapAsync(controller.renderAuditLog));

module.exports = router;
