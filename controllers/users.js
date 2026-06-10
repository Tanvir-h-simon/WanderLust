const User = require("../models/user");

module.exports.renderSignup = (req, res) => {
    if (req.isAuthenticated()) return res.redirect("/listings");
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!password || (typeof password === 'string' && password.length < 8)) {
            req.flash("error", "Password must be at least 8 characters.");
            return res.redirect("/signup");
        }
        if (typeof password !== 'string' || password.length > 128) {
            req.flash("error", "Password must not exceed 128 characters.");
            return res.redirect("/signup");
        }
        if (typeof password !== 'string' || (!/[0-9]/.test(password) && !/[^a-zA-Z0-9]/.test(password))) {
            req.flash("error", "Password must contain at least one number or punctuation character.");
            return res.redirect("/signup");
        }

        const newUser        = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", `Welcome to WanderLust, ${registeredUser.username}!`);
            res.redirect("/listings");
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLogin = (req, res) => {
    if (req.isAuthenticated()) return res.redirect("/listings");
    res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
    req.flash("success", `Welcome back, ${req.user.username}!`);
    const redirectUrl = res.locals.returnTo || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You have been logged out.");
        res.redirect("/");
    });
};
