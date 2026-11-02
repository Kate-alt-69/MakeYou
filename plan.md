# MakeYou — Product and implementation plan

**Status:** Initial implementation  
**Application repository:** Kate-alt-69/MakeYou  
**Engine source:** Kastrick8/nextjs-engine, Gen 3 alpha  
**Deployment target:** Vercel

## 1. Product direction

MakeYou is an independent, lightweight, modern web client for discovering and watching YouTube videos. It should feel like a polished contemporary media application: clean typography, clear hierarchy, responsive layouts, subtle motion, useful controls, and fast interactions.

The goal is not to reproduce YouTube's website pixel-for-pixel or to pretend that MakeYou is served from youtube.com. MakeYou has its own name, origin, visual identity, privacy model, and added value: a compact interface, performance controls, deliberate navigation, share-link intake, and future opt-in local features.

The interface should remain familiar enough for video discovery, but must be recognizably MakeYou rather than an indistinguishable YouTube clone.

## 2. Non-negotiable integration boundaries

MakeYou uses YouTube's documented APIs and the official embedded player. It does not read YouTube cookies, copy an existing YouTube login session, scrape private pages, call undocumented internal endpoints, extract stream URLs, or spoof the youtube.com origin.

The official player remains responsible for playback, player controls, attribution, playback context, and advertisements. MakeYou must not remove, replace, skip, hide, or filter YouTube-served advertisements; modify the player; hide player links or controls; separate audio/video streams; enable background playback; or add download functionality for YouTube videos.

An opt-in ad-blocker for YouTube playback is therefore **out of scope**. The application itself will not add its own advertising. Privacy controls may govern MakeYou-owned analytics, optional diagnostics, local history, and unrelated third-party integrations, but must not interfere with YouTube/Google player requests, cookies, referrer context, or advertisements.

The application must provide sufficient independent value and keep MakeYou's identity clearly distinct from YouTube. Review the official policies before adding new YouTube-facing features:
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/developer-policies-guide
- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/v3/docs

## 3. Engine source and pin

Use the latest verified Gen 3 source artifact, not the older published npm dist-tag or the older archived package snapshot.

- Engine repository default branch: main-3
- Verified source commit: 3242b044a846babf9010e78be6b1e776619a3ae4
- Source commit date: 2026-11-01
- Alpha package version: 3.0.0-alpha.1
- Artifact: the commit-specific tarball attached to the channel-alpha-latest GitHub release
- Artifact SHA-256 reported by GitHub: 75b4e75d1dd64c5c8892076c48b4d459540844362067865c8f9a39bad3f0e081

The Engine branch tip and its exact-commit check suite were inspected before selecting the artifact. All 13 reported check runs for the selected SHA completed successfully. The rolling alpha workflow packages the exact main-3 SHA only after runtime CI and cross-browser CI pass, rechecks that the commit is still the branch head, and then attaches the package tarball. The URL is pinned to the commit-specific asset filename; it is not an unpinned npm alpha install.

MakeYou consumes the tarball as the @kastrick/nextjs-engine dependency. It does not copy Engine source into this repository and does not modify or push anything to Kastrick8/nextjs-engine.

Engine integration in this first slice:
- The Engine Next.js plugin is enabled through next.config.js.
- EngineImage is used for YouTube thumbnails with viewport-aware loading.
- Thumbnail requests are not routed through image re-encoding; the returned YouTube thumbnail is displayed as supplied.
- The official YouTube player remains an iframe, not EngineVideo. EngineVideo is for native media sources such as MP4/WebM, not YouTube's player.

## 4. First milestone — dynamic homepage

The first milestone includes:
- A responsive MakeYou application shell with a compact desktop sidebar and mobile navigation.
- A modern header with search, theme control, and URL import.
- Category filters for public popular-video charts.
- A dynamic video grid with loading, empty, API-not-configured, and API-error states.
- A server-side YouTube Data API integration for popular videos and explicit search requests.
- A watch route using the official YouTube embedded player.
- Manual YouTube URL import and an installed-PWA share target.
- A concise setup guide and Vercel environment-variable instructions.

The Data API's mostPopular chart is a public popularity feed, not a personalized YouTube Home feed. Search requests run only after an explicit form submission. Do not label either source as personalized recommendations.

## 5. YouTube data integration

The first milestone uses YouTube Data API v3:
- Public discovery: videos.list with chart=mostPopular, regionCode, and optional videoCategoryId.
- Search: search.list with type=video and a bounded result count.
- API key: YOUTUBE_DATA_API_KEY, read only by server-side route handlers.
- Default region: IN, configurable with YOUTUBE_REGION_CODE.
- Popular results are revalidated for five minutes; search is user-triggered and is not polled in the background.

The API key must be created in Google Cloud, restricted to the YouTube Data API, and stored in .env.local locally and Vercel project environment variables in production. Never prefix it with NEXT_PUBLIC_, place it in client code, or commit a real key.

Personal account data is a separate milestone. When account features are added, use Google OAuth with the minimum scopes needed for features that have actually shipped. Do not request broad permissions in advance and do not copy the browser's existing YouTube session.

The Data API does not provide every item shown by the YouTube website. In particular, do not promise that the API can return private watch history, Watch Later contents, or a personalized Home feed. MakeYou may later offer its own opt-in local history, clearly separate from YouTube account history.

Quota must be treated as a real product constraint. Keep search user-initiated, bound the number of results, cache public discovery responses, and do not poll the Data API continuously.

## 6. URL intake and Android sharing

The first milestone normalizes these supported URL forms into MakeYou's own watch route:
- youtube.com and www.youtube.com
- m.youtube.com and music.youtube.com
- youtu.be
- youtube-nocookie.com embed URLs
- watch, shorts, live, embed, and playlist paths
- Android intent:// URLs that contain a YouTube HTTPS destination
- vnd.youtube: URI forms carrying a video ID or watch URL

The parser must validate the hostname and video/playlist identifiers. It must never accept an arbitrary URL and redirect to it.

An installed PWA can register a Web Share Target through its web manifest where the browser supports that feature. This enables MakeYou to appear in supported Android share sheets and receive a shared YouTube URL at /share. Browser support is not universal, so manual paste/import remains available.

A web application cannot claim the native com.google.android.youtube package identity or silently become the Android YouTube app's native intent handler. Verified Android App Links for a future MakeYou Android wrapper would require MakeYou's own package ID, signing-certificate fingerprint, and Digital Asset Links file on MakeYou's own domain.

## 7. Privacy and opt-in features

Privacy defaults should be conservative and visible:
- MakeYou-owned analytics and telemetry remain disabled unless a later, explicit opt-in feature is implemented.
- Optional local viewing history must be off until the user enables it.
- Any future third-party tracker controls must be scoped to MakeYou-owned pages and unrelated integrations. They must not filter YouTube player traffic, advertisements, or the cookies and context needed for playback verification.
- Do not imply that a privacy toggle can remove YouTube advertisements or make an embedded player ad-free.

The first milestone does not ship a YouTube ad-blocker, playback-ad skipper, tracker filter for YouTube/Google endpoints, or player modification layer.

## 8. Performance principles

- Keep the homepage server-rendered at the application boundary and confine interactivity to small client components.
- Use the Engine scheduler-aware image component for thumbnails; defer media loading until it approaches the viewport.
- Do not mount YouTube iframes in the home grid. Create the official player only on the watch route.
- Use reserved thumbnail aspect ratios to reduce layout shift.
- Search only on submit, not on every keystroke.
- Cache public popular-video data for a short, bounded period.
- Avoid autoplay, background playback, unnecessary animation loops, and decorative video.
- Respect reduced-motion preferences.
- Keep typography, cards, and navigation responsive without a large client-side state framework.

## 9. Deployment and local development

The repository is a standalone Next.js application. The Engine is a package dependency; its source repository remains separate.

Local setup:
1. Install Node.js 22 or newer.
2. Run npm install to download the pinned Engine alpha artifact and application dependencies.
3. Copy .env.example to .env.local.
4. Set YOUTUBE_DATA_API_KEY in .env.local.
5. Run npm run dev.

Vercel setup:
1. Import Kate-alt-69/MakeYou as a Next.js project.
2. Set YOUTUBE_DATA_API_KEY and, optionally, YOUTUBE_REGION_CODE in project environment variables.
3. Deploy using the standard Next.js build.
4. Add Google OAuth credentials only when the account-linking milestone is implemented and its consent scopes have been reviewed.

## 10. Milestones after the homepage

1. **Playback and link intake:** verify watch URLs, embedded player behavior, playlist handling, Android PWA share intake, and mobile layouts.
2. **Account connection:** implement Google OAuth and only the authorized subscriptions/playlists/profile surfaces supported by the API.
3. **Personal library:** add opt-in MakeYou-local history, bookmarks, and queues without describing them as YouTube's private history.
4. **Privacy settings:** add explicit, documented controls for MakeYou-owned telemetry and local data retention.
5. **Performance pass:** test low-memory devices, Firefox, Chromium, mobile browsers, slow networks, layout shift, and script/heap budgets.
6. **Release and compliance:** verify API attribution, required player behavior, policy compliance, OAuth consent, quota handling, and Vercel production configuration.

## 11. First-milestone acceptance criteria

- The home route renders a complete responsive MakeYou interface without requiring a YouTube API key.
- With a valid server-side API key, the home route loads public popular videos and category filters.
- Search runs only after submit and presents real Data API results or a clear error.
- A shared YouTube watch/shorts/live/embed URL resolves to the correct MakeYou watch route.
- A playlist URL is retained and passed to the official embedded player.
- Android share-target intake accepts supported URL and intent URI forms without open redirects.
- Home cards use EngineImage and do not mount video players.
- The watch page uses the official embedded player and passes MakeYou's actual origin when enabling the IFrame JavaScript API.
- YouTube player controls, attribution, advertisements, and required playback behavior remain intact.
- No credentials, API keys, or Google OAuth secrets are exposed to client code.
- The Engine source repository is unchanged.
