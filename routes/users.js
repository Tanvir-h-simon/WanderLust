const express    = require("express");
const router     = express.Router();
const passport   = require("passport");
const wrapAsync  = require("../utils/wrapAsync");
const controller = require("../controllers/users");
const { saveRedirectUrl } = require("../middleware/index");

router.get("/signup",  controller.renderSignup);
router.post("/signup", wrapAsync(controller.signup));

router.get("/login",   controller.renderLogin);
router.post("/login",
    saveRedirectUrl,
    passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }),
    controller.login
);

router.get("/logout",  controller.logout);

router.get("/admin/login",  controller.renderAdminLogin);
router.post("/admin/login",
    saveRedirectUrl,
    passport.authenticate("local", { failureFlash: true, failureRedirect: "/admin/login" }),
    controller.adminLogin
);

module.exports = router;
