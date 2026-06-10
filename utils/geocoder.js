const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

let geocodingClient;

function getClient() {
    if (!geocodingClient) {
        geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });
    }
    return geocodingClient;
}

// Returns a GeoJSON Point geometry or null if geocoding fails / no results.
async function geocode(location, country) {
    const query = [location, country].filter(Boolean).join(", ");
    if (!query) return null;
    try {
        const response = await getClient()
            .forwardGeocode({ query, limit: 1 })
            .send();
        return response.body.features[0]?.geometry || null;
    } catch (err) {
        console.warn("Geocoding failed:", err.message);
        return null;
    }
}

module.exports = { geocode };
