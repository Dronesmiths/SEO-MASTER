/**
 * Utility for generating Google Maps, Street View, and Directions components.
 * Requires a valid Google Maps API Key in local-config.json.
 */

function generateMapEmbed(apiKey, location, zoom = 14) {
    if (!apiKey) return '';
    const encodedLocation = encodeURIComponent(location);
    return `
        <div class="map-container" style="width: 100%; height: 450px; border-radius: 8px; overflow: hidden; margin: 20px 0;">
            <iframe
                width="100%"
                height="450"
                style="border:0"
                loading="lazy"
                allowfullscreen
                referrerpolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}&zoom=${zoom}">
            </iframe>
        </div>
    `;
}

function generateStaticMap(apiKey, location, size = '600x400', zoom = 13) {
    if (!apiKey) return '';
    const encodedLocation = encodeURIComponent(location);
    return `<img src="https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=${zoom}&size=${size}&markers=color:red%7C${encodedLocation}&key=${apiKey}" alt="Map of ${location}" style="width: 100%; height: auto; border-radius: 8px;">`;
}

function generateStreetView(apiKey, location, size = '600x300', heading = 0, pitch = 0) {
    if (!apiKey) return '';
    const encodedLocation = encodeURIComponent(location);
    return `<img src="https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedLocation}&heading=${heading}&pitch=${pitch}&key=${apiKey}" alt="Street view of ${location}" style="width: 100%; height: auto; border-radius: 8px;">`;
}

function generateDirectionsLink(destination, origin = '') {
    const encodedDest = encodeURIComponent(destination);
    const encodedOrigin = origin ? encodeURIComponent(origin) : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}${encodedOrigin ? '&origin=' + encodedOrigin : ''}`;
    return `<a href="${url}" target="_blank" class="directions-button" style="display: inline-block; padding: 12px 24px; background: #4285F4; color: white; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 10px;">Get Directions</a>`;
}

function generatePlaceReview(apiKey, placeId) {
    if (!apiKey || !placeId) return '';
    // Note: Standard embeds don't show specific reviews easily without Places JS library,
    // but we can provide a "View Reviews" link that deep-links to the reviews tab.
    const url = `https://search.google.com/local/reviews?placeid=${placeId}`;
    return `<div class="reviews-cta" style="margin-top: 15px;">
        <p>⭐ See what our customers are saying in this area!</p>
        <a href="${url}" target="_blank" style="color: #4285F4; text-decoration: underline; font-weight: bold;">View our ${placeId ? 'verified' : ''} Google Reviews</a>
    </div>`;
}

module.exports = {
    generateMapEmbed,
    generateStaticMap,
    generateStreetView,
    generateDirectionsLink,
    generatePlaceReview
};
