function isObject(value) {
    return value !== null && typeof value === "object";
}

function clean(obj) {
    if (!isObject(obj)) return;
    for (const key of Object.keys(obj)) {
        if (key.includes("$") || key.includes(".")) {
            delete obj[key];
        } else {
            clean(obj[key]);
        }
    }
}

module.exports = function mongoSanitize(req, res, next) {
    clean(req.body);
    clean(req.params);
    clean(req.query);   // mutated in place — req.query is never reassigned
    next();
};
