# MakeYou

MakeYou is an independent, performance-minded YouTube discovery and playback web client built with Next.js, React, and the Gen 3 alpha of Next.js Engine.

## Local development

Requirements: Node.js 22 or newer and npm.

1. Clone this repository.
2. Install dependencies:

   npm install

   This downloads the Engine package tarball pinned to the latest verified main-3 source commit selected in plan.md. It does not install the older floating npm dist-tag.
   The project-level `.npmrc` sets `allow-remote=root` for npm 12+: it permits this explicitly declared Engine tarball while continuing to block URL dependencies that are not listed directly in this project's `package.json`. It does not change your global npm configuration.
3. Copy .env.example to .env.local.
4. Add a YouTube Data API v3 key as YOUTUBE_DATA_API_KEY. Keep it server-side; do not rename it to a NEXT_PUBLIC_ variable.
5. Start the development server:

   npm run dev

Open http://localhost:3000.

## YouTube API setup

Enable YouTube Data API v3 in a Google Cloud project, create an API key, and restrict the key to the YouTube Data API. Set the key in .env.local for development and in Vercel Project Settings → Environment Variables for deployment.

The home page uses the public mostPopular chart. Search is requested only after submitting the search form. A missing key produces a setup message rather than fake video content.

## Vercel

Import Kate-alt-69/MakeYou into Vercel as a Next.js project. Configure YOUTUBE_DATA_API_KEY and optionally YOUTUBE_REGION_CODE, then deploy with the standard Next.js build.

## Current scope

The first milestone includes a responsive homepage, public discovery/search routes, YouTube link import, an Android-capable PWA share-target declaration, and the official YouTube embedded player route.

MakeYou does not impersonate youtube.com, read YouTube browser cookies, scrape private YouTube pages, alter the official player, or remove/skip YouTube-served advertisements. See plan.md for the product boundaries and roadmap.
