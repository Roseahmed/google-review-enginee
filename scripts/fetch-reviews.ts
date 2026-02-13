import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import "dotenv/config";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("❌ GOOGLE_API_KEY missing");
  process.exit(1);
}

/* ==============================
   CONFIG
============================== */

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_DELAY = 1000; // 1 second per request

/* ==============================
   TYPES
============================== */

interface Client {
  slug: string;
  placeId: string;
  type: string;
  name: string;
  url: string;
  phone: string;
  priceRange?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  geo: {
    lat: number;
    lng: number;
  };
}

/* ==============================
   UTILS
============================== */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRating(rating: number) {
  return Math.round(rating * 10) / 10;
}

function sortReviews(reviews: any[]) {
  return reviews.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.time - a.time;
  });
}

/* ==============================
   PRODUCTION SCHEMA GENERATOR
============================== */

function generateSchema(client: Client, ratingData: any) {
  return {
    "@context": "https://schema.org",
    "@type": client.type || "LocalBusiness",

    "@id": client.url,
    name: client.name,
    url: client.url,
    telephone: client.phone,
    priceRange: client.priceRange,

    address: {
      "@type": "PostalAddress",
      streetAddress: client.address.street,
      addressLocality: client.address.city,
      addressRegion: client.address.state,
      postalCode: client.address.postalCode,
      addressCountry: client.address.country,
    },

    geo: {
      "@type": "GeoCoordinates",
      latitude: client.geo.lat,
      longitude: client.geo.lng,
    },

    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingData.rating,
      reviewCount: ratingData.totalRatings,
    },
  };
}

/* ==============================
   FETCH LOGIC
============================== */

async function fetchClientReviews(client: Client) {
  const filePath = `data/${client.slug}.json`;

  // Cache check
  if (existsSync(filePath)) {
    const cached = JSON.parse(readFileSync(filePath, "utf-8"));
    const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();

    if (cacheAge < CACHE_DURATION) {
      console.log(`⚡ Using fresh cache for ${client.slug}`);
      return null;
    }
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${client.placeId}&fields=name,rating,user_ratings_total,reviews&key=${GOOGLE_API_KEY}`,
  );

  const data = await response.json();

  if (!data.result) {
    throw new Error(`Invalid API response for ${client.slug}`);
  }

  let reviews = data.result.reviews || [];
  reviews = sortReviews(reviews).slice(0, 5);

  const normalizedRating = normalizeRating(data.result.rating);

  return {
    name: data.result.name,
    rating: normalizedRating,
    totalRatings: data.result.user_ratings_total,
    reviews,
    schema: generateSchema(client, {
      rating: normalizedRating,
      totalRatings: data.result.user_ratings_total,
    }),
    lastUpdated: new Date().toISOString(),
  };
}

/* ==============================
   MAIN RUNNER
============================== */

export async function fetchAndSaveReview() {
  const clients: Client[] = JSON.parse(readFileSync("clients.json", "utf-8"));

  if (!existsSync("data")) {
    mkdirSync("data");
  }

  const tasks = clients.map(async (client, index) => {
    try {
      // Rate limit spacing
      await delay(index * RATE_LIMIT_DELAY);

      const result = await fetchClientReviews(client);

      if (!result) return;

      writeFileSync(
        `data/${client.slug}.json`,
        JSON.stringify(result, null, 2),
      );

      console.log(`✅ Updated ${client.slug}`);
    } catch (error: any) {
      console.error(`⚠️ ${error.message}`);

      if (existsSync(`data/${client.slug}.json`)) {
        console.log(`🔁 Using cached version for ${client.slug}`);
      } else {
        console.error(`❌ No fallback available for ${client.slug}`);
      }
    }
  });

  await Promise.all(tasks);
}
