if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

// Validate required environment variables 
const REQUIRED_ENV = ["MONGO_ATLAS_URL", "SECRET", "CLOUD_NAME", "API_KEY", "CLOUD_API_SECRET", "MAPBOX_TOKEN"];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error("Missing required environment variables:", missingEnv.join(", "));
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const ejsMate = require("ejs-mate");
const passport = require("passport");

const User = require("./models/user");
const Listing = require("./models/listing");
const ExpressError = require("./utils/expressError");
const wrapAsync = require("./utils/wrapAsync");

const helmet = require("helmet");
const MongoStore = require("connect-mongo");
const mongoSanitize = require("./middleware/sanitize");

const listingRoutes = require("./routes/listings");
const userRoutes = require("./routes/users");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");

// Database
const dbUrl = process.env.MONGO_ATLAS_URL;
mongoose.connect(dbUrl)
    .then(() => console.log("Database connection successful"))
    .catch(err => console.error("Database connection error:", err));

// View engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security
if (isProduction) {
    app.set("trust proxy", 1);   // trust the first proxy so secure cookies work behind a host's TLS (Render, etc.)
}

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://api.mapbox.com"],
            scriptSrcAttr: ["'unsafe-inline'"],   // allow inline onclick handlers (confirm dialogs, password toggle)
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://api.mapbox.com", "https://fonts.googleapis.com"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"],
            connectSrc: ["'self'", "https://api.mapbox.com", "https://events.mapbox.com", "https://*.tiles.mapbox.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:", "https://api.mapbox.com", "https://res.cloudinary.com", "https://images.unsplash.com", "https://shorturl.at"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        },
    },
    crossOriginEmbedderPolicy: false,   // allow cross-origin map tiles / Cloudinary images
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize);   // strip Mongo operators ($, .) from incoming data
app.use(methodOverride("_method"));
app.use(cookieParser(process.env.SECRET));
app.use(express.static(path.join(__dirname, "public")));

const sessionStore = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60   // only re-save an unchanged session once per day
});
sessionStore.on("error", (err) => console.error("Session store error:", err));

app.use(session({
    store: sessionStore,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,   // HTTPS-only cookies in production
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Pass flash messages, current user, and Mapbox token to every template
app.use((req, res, next) => {
    // connect-flash returns an array, but guard against unexpected nulls
    const success = req.flash("success") || [];
    const error = req.flash("error") || [];

    const currencyMap = {
        "USD": { currency: "USD", symbol: "$", rate: 1, locale: "en-US" },
        "BDT": { currency: "BDT", symbol: "৳", rate: 120, locale: "en-BD" }
    };

    const savedCurrency = req.session.currencyPreference?.currency || "USD";
    const selectedCurrency = currencyMap[savedCurrency] || currencyMap["USD"];

    if (!req.session.currencyPreference) {
        req.session.currencyPreference = {
            currency: selectedCurrency.currency,
            symbol: selectedCurrency.symbol,
            rate: selectedCurrency.rate,
            locale: selectedCurrency.locale
        };
    } else {
        req.session.currencyPreference.currency = selectedCurrency.currency;
        req.session.currencyPreference.symbol = selectedCurrency.symbol;
        req.session.currencyPreference.rate = selectedCurrency.rate;
        req.session.currencyPreference.locale = selectedCurrency.locale;
    }

    const currencyPreference = {
        currency: req.session.currencyPreference.currency,
        symbol: req.session.currencyPreference.symbol,
        rate: req.session.currencyPreference.rate,
        locale: req.session.currencyPreference.locale
    };

    res.locals.success = success;
    res.locals.error = error;
    res.locals.currentUser = req.user;
    res.locals.isAdmin = req.user && req.user.role === 'admin';
    res.locals.mapboxToken = process.env.MAPBOX_TOKEN;
    res.locals.showCategoryBar = false;   // listings index sets this to true
    res.locals.activeCategory = "";
    res.locals.currencyPreference = currencyPreference;

    next();
});

// Currency preference route
app.post("/preferences/currency", (req, res) => {
    const { currency } = req.body;
    const currencyMap = {
        "USD": { currency: "USD", symbol: "$", rate: 1, locale: "en-US" },
        "BDT": { currency: "BDT", symbol: "৳", rate: 120, locale: "en-BD" }
    };

    if (currencyMap[currency]) {
        req.session.currencyPreference = {
            ...currencyMap[currency]
        };
    }

    const referer = req.get("Referer") || "";
    const isSameOrigin = referer && (() => {
        try {
            const url = new URL(referer);
            return url.host === req.get("host");
        } catch { return false; }
    })();
    res.redirect(isSameOrigin ? referer : "/listings");
});
 
// Home route
app.get("/", wrapAsync(async (req, res) => {
    const featuredListings = await Listing.find({}).limit(12);
    res.render("pages/home.ejs", { featuredListings });
}));

// Routes
app.use("/listings", listingRoutes);
app.use("/", userRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/admin", adminRoutes);

// 404 
app.use((req, res, next) => {
    next(new ExpressError("Page not found!", 404));
});

// Error handler 
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Internal Server Error" } = err;
    if (req.flash) {
        try { req.flash("error", message); } catch (_) { }
    }
    if (res.headersSent) return;
    res.status(statusCode).render("layouts/error.ejs", { statusCode, message }, (renderErr, html) => {
        if (res.headersSent) return;
        if (renderErr) {
            res.status(statusCode).send(`<h1>${statusCode}</h1><p>${message}</p>`);
        } else {
            res.send(html);
        }
    });
});

process.on('uncaughtException', (err) => {
    if (err.code === 'ERR_HTTP_HEADERS_SENT') {
        return;
    }
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
