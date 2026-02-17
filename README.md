# Review Engine

A lightweight Google Reviews aggregator that fetches, caches, and serves review data with Schema.org structured data for SEO. Built with [Bun](https://bun.sh) and TypeScript.

## Features

- **Automated Review Fetching** - Pulls reviews from Google Places API
- **Smart Caching** - 24-hour cache to minimize API calls
- **Schema.org Structured Data** - Generates SEO-friendly JSON-LD markup
- **Rate Limiting** - Built-in delays to respect API limits
- **GitHub Actions Integration** - Daily automated updates at 6 AM IST
- **GitHub Pages Deployment** - Serves JSON data as static assets
- **Multi-Client Support** - Configure multiple businesses in `clients.json`

## Prerequisites

- [Bun](https://bun.sh) v1.2.4+
- Google Places API key

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd review-engine

# Install dependencies
bun install
```

## Configuration

### 1. Environment Variables

Create a `.env` file:

```bash
GOOGLE_API_KEY=your_google_places_api_key_here
```

### 2. Client Configuration

Add your business details to `clients.json`:

```json
[
  {
    "slug": "your-business",
    "placeId": "ChIJ...",
    "type": "LocalBusiness",
    "name": "Your Business Name",
    "url": "https://yourwebsite.com",
    "phone": "+1-555-123-4567",
    "priceRange": "$$",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "geo": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
]
```

## Usage

### Local Development

```bash
# Fetch reviews manually
bun run fetch:reviews
```

### GitHub Actions Automation

The workflow (`.github/workflows/deploy.yml`) automatically:

1. **Fetches reviews** daily at 6 AM IST
2. **Commits updates** to the repository
3. **Deploys data** to GitHub Pages

**Setup:**

1. Add `GOOGLE_API_KEY` to your repository secrets (Settings → Secrets → Actions)
2. Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)

**Manual Trigger:**

```bash
# Go to Actions → Update & Deploy Reviews → Run workflow
```

## Data Structure

Each client generates a JSON file in `/data/{slug}.json`:

```json
{
  "name": "Business Name",
  "rating": 4.5,
  "totalRatings": 100,
  "reviews": [
    {
      "author_name": "John Doe",
      "rating": 5,
      "text": "Great service!",
      "time": 1637746329
    }
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.5,
      "reviewCount": 100
    }
  },
  "lastUpdated": "2026-02-16T04:23:03.799Z"
}
```

## Project Structure

```
├── .github/workflows/     # GitHub Actions automation
├── data/                  # Cached review data (auto-generated)
├── scripts/
│   └── fetch-reviews.ts   # Main fetch logic
├── clients.json           # Business configuration
├── index.ts               # Entry point
└── package.json           # Dependencies
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Places API key | Yes |

## License

MIT
