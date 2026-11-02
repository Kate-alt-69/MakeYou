# MakeYou — Product, Architecture & Delivery Plan

**Status:** Active development — first homepage/watch flow implemented; advanced provider and library architecture is the next design direction  
**Application repository:** [Kate-alt-69/MakeYou](https://github.com/Kate-alt-69/MakeYou)  
**Default branch:** \`main\`  
**Engine source:** [kastrick8/nextjs-engine](https://github.com/kastrick8/nextjs-engine), Gen 3 alpha  
**Deployment target:** Vercel  
**Last plan review:** 2026-11-02

---

## 1. Product direction

MakeYou is a modern, lightweight, user-controlled video client. It starts with YouTube, but the product should be designed around a flexible media experience rather than around one fixed YouTube page layout or one permanently fixed integration method.

The goal is to make video discovery and playback feel fast, personal, configurable, and comfortable on desktop and mobile. MakeYou should offer useful independent value through features such as:

- A configurable discovery surface instead of a single fixed feed.
- A clean, compact interface that performs well on lower-end hardware.
- Custom queues, bookmarks, local history, playlists, and saved searches.
- Keyboard-first controls, playback preferences, themes, and layout choices.
- Optional metadata and community integrations such as SponsorBlock and Return YouTube Dislike.
- A proper PWA/share-target experience and a future browser-extension or native-wrapper path.
- A provider architecture that can evolve without rewriting the entire UI.

MakeYou must have its own identity, domain, UI, settings, and privacy story. It may take inspiration from familiar video clients, but its value should come from what MakeYou adds: customization, local-first organization, interoperability, accessibility, and a better workflow.

## 2. Product and integration strategy

The previous plan treated too many advanced features as blanket exclusions. This plan replaces those blanket exclusions with **integration modes, capability checks, and release-risk labels**.

A feature should not be rejected just because an earlier version of this plan called it out of scope. Evaluate it based on:

1. Whether the chosen provider exposes the capability.
2. Whether the browser can perform it directly or needs a thin server proxy.
3. Reliability, performance, privacy, and maintenance cost.
4. The platform terms and legal requirements that apply to that particular integration.
5. Whether the feature belongs in the web app, a browser extension, or a native wrapper.

Use these implementation labels throughout planning and the UI:

- **Supported:** documented API or browser capability with a stable integration contract.
- **Optional:** user-enabled functionality that is not required for the core experience.
- **Experimental:** technically possible but dependent on an unofficial, unstable, or changing integration.
- **Separate platform:** requires browser-extension or native-app permissions that a normal website does not have.
- **Review required:** needs a product, policy, licensing, or legal assessment before public release.

These labels describe the current maturity of an integration, not permanent product bans. Keep a decision log when a capability changes status.

## 3. Architecture overview — client-first, not client-only

MakeYou should run primarily in the user's browser. The browser owns the interactive application, presentation, navigation, preferences, local library, and as much provider work as can be performed safely and reliably on the client.

The backend should be a **thin serverless backend-for-frontend (BFF)**. It exists to bridge browser limitations and protect server-side credentials, not to turn every request or every video byte into a backend workload.

### 3.1 Browser responsibilities

The client should own:

- The application shell, navigation, search UI, watch UI, settings, and responsive layout.
- Provider selection and capability-aware feature composition.
- Search input, filters, sort order, queues, and user interaction state.
- Local preferences, themes, playback preferences, bookmarks, saved playlists, and opt-in local history.
- IndexedDB-backed local metadata and state, with bounded cache expiry.
- Share-target parsing and navigation.
- Optional integrations that can be called safely from the browser.
- Playback controls through the selected playback provider's documented or supported interface.
- User-facing error, loading, offline, and provider-status states.

Keep client components focused. Prefer URL state for shareable navigation and IndexedDB for richer persistent local data. Do not introduce a large global state framework unless the application demonstrates a real need for one.

### 3.2 Thin backend responsibilities

Use Next.js Route Handlers / Vercel Functions for tasks that genuinely need a server:

- Protecting YouTube Data API keys and other provider credentials.
- Forwarding documented API requests when direct browser requests would expose credentials or fail due to CORS.
- OAuth authorization-code callbacks, token exchange, and secure session handling where server-side OAuth is selected.
- Proxying selected unofficial-provider requests when its browser integration requires a proxy.
- Normalizing provider responses into MakeYou's own stable response types.
- Applying request validation, rate limits, quota protection, caching, and abuse controls.
- Handling provider-specific operations that cannot run in the browser.
- Returning short-lived playback metadata or rewritten manifests only when a selected playback provider requires it.

The default backend must **not** relay every media segment or become a general-purpose video CDN. Prefer direct browser playback from the provider where that works. Add media proxying only for a specific provider that requires it, and measure bandwidth, range-request behavior, cacheability, concurrency, and Vercel cost before enabling it publicly.

Do not build an open proxy. Provider hosts, request paths, methods, headers, and redirect destinations must be explicitly controlled. Never let an arbitrary user-supplied URL become an unrestricted server-side fetch target.

### 3.3 Request flow

Typical discovery flow:

1. The client asks the selected discovery provider for a feed or search result.
2. A request goes directly to a provider only when the provider supports browser use for that operation.
3. Otherwise the client calls a same-origin MakeYou endpoint.
4. The thin BFF validates the request, attaches server-side credentials where applicable, applies cache/quota rules, and returns normalized metadata.
5. The client renders results and stores only the local state/cache needed for the user's experience.

Typical playback flow:

1. The client selects a playback provider based on the video and the active integration mode.
2. The provider adapter returns an embed configuration or a playback session.
3. The browser mounts the official iframe or the selected native/custom player.
4. Media requests go directly to the provider whenever possible.
5. A server media proxy is used only when required by the selected provider and after its resource costs and policy implications have been reviewed.

## 4. Provider-based design

Discovery, playback, and enrichment should be separate interfaces. A provider that can search videos is not automatically a provider that can play them.

Create stable internal contracts under a structure such as:

- \`src/lib/providers/discovery/\`
- \`src/lib/providers/playback/\`
- \`src/lib/providers/enrichment/\`
- \`src/lib/providers/shared/\`

The exact folder names can follow the existing source layout when implementation begins.

### 4.1 Discovery providers

A discovery provider may expose capabilities such as:

- Search videos, channels, and playlists.
- Popular/trending feeds where available.
- Channel uploads and public playlist contents.
- Categories, metadata, thumbnails, and pagination.
- Related or recommended items where the provider exposes them.

Each provider must declare which capabilities it supports. The UI should not show controls that the active provider cannot fulfill.

### 4.2 Playback providers

A playback provider may expose:

- Official embedded playback.
- Native HTML media playback for supported media sources.
- Playback metadata and duration.
- Queue and playlist operations.
- Play, pause, seek, volume, rate, captions, and state events where supported.
- Picture-in-picture and fullscreen where supported by the browser and player.
- Optional media-session integration.

Keep player-specific behavior inside the adapter. Do not make the home grid or global UI depend directly on one provider's player API.

### 4.3 Enrichment providers

Enrichment is optional and should not be confused with the source of the underlying video:

- SponsorBlock segment metadata and user-configurable skip categories.
- Return YouTube Dislike or another separately sourced community rating.
- Community chapters, alternate thumbnails, and title metadata.
- Caption/transcript tools where the source and permissions allow them.
- Other user-selected metadata services.

Show provenance for information that is not supplied by the primary video provider. Do not silently replace one provider's values with independently sourced metrics.

### 4.4 Provider status and fallback

Use explicit provider status states such as ready, degraded, unavailable, rate-limited, and experimental. A failed provider must not take down the entire application.

Allow users to select an integration mode when more than one is available. A fallback must be visible and explain which provider is being used; do not silently switch between integrations that have materially different privacy, playback, or policy characteristics.

## 5. YouTube integration modes

YouTube remains the first supported source, but the implementation should distinguish official integration from experimental community tooling.

### 5.1 Official YouTube mode

Use the documented YouTube Data API and official IFrame Player API for the stable integration.

Current use cases:

- Public discovery and video search through YouTube Data API v3.
- Video, channel, category, and playlist metadata where documented endpoints support it.
- Official embedded playback through the IFrame Player API.
- Player events and controls exposed by the official IFrame API.
- Google Identity Services for account authorization when account features are added.

Implementation notes:

- Keep API keys on the server.
- Request only the fields needed by the screen being rendered.
- Cache public metadata for short, explicit periods and respect provider update requirements.
- Track quota use and errors; do not assume quotas are unlimited.
- Make search user-driven or otherwise deliberately rate-limited.
- Use the official player for this mode. \`EngineVideo\` is for native media sources such as MP4/WebM; it is not a replacement for YouTube's embedded player.
- Keep attribution, provider identity, and required player behavior intact.

The existing homepage uses the public \`mostPopular\` chart. That is a public popularity feed, not a personalized YouTube Home feed. Continue to label it accurately. MakeYou's own local recommendations, if later introduced, must be described as MakeYou-generated and must not be presented as YouTube's recommendation data.

### 5.2 Experimental InnerTube / YouTube.js mode

Evaluate \`youtubei.js\` (YouTube.js) as an experimental provider adapter for researching additional discovery and playback capabilities.

This integration uses YouTube's internal, undocumented InnerTube interface. It is not an official YouTube API and can change without the stability guarantees of a documented API.

Technical observations:

- The library supports Node.js, Deno, and modern browser environments.
- Its current browser-usage guide says browser requests must be proxied through an application server.
- Its browser streaming guide also routes the media requests through a server and describes converting the returned data into a DASH manifest.
- Stream formats, signatures, player behavior, and availability may change independently of MakeYou releases.

Architecture:

- Keep this adapter separate from the official Data API provider.
- Put its transport behind the provider interface so the UI does not depend on InnerTube response shapes.
- Keep the proxy narrow and provider-specific; do not turn it into an arbitrary URL or general media relay.
- Add provider health checks, timeouts, cache limits, and clear unsupported/error states.
- Test browser playback, range requests, CORS, captions, live streams, playlists, and Firefox separately.
- Pin the library version and record the tested upstream commit/version.
- Treat it as experimental until reliability, deployment cost, and applicable terms have been reviewed.

Do not assume that using a separate adapter or a runtime toggle automatically changes the policies that apply to the overall product. In particular, YouTube's current Developer Policies prohibit undocumented API use by YouTube API Clients. If MakeYou uses YouTube API Services, the official API-client obligations apply. Before combining official API services with an InnerTube-based public distribution, determine whether the modes can legally and contractually coexist; seek YouTube policy guidance or an API Compliance Audit where appropriate. Do not represent an experimental integration as an official or endorsed YouTube API.

### 5.3 Account connection

When account features are implemented:

- Use Google Identity Services and the authorization-code flow with PKCE where applicable.
- Request only the scopes needed for the feature the user is currently enabling.
- Never ask for, read, or copy a user's Google/YouTube password or browser cookies.
- Keep access tokens out of URLs, logs, analytics, and client-visible server responses.
- Prefer secure, HTTP-only server sessions when server-managed tokens are necessary.
- Provide disconnect, token revocation, and data deletion flows.
- Make it clear which data comes from a connected YouTube account and which data is stored only by MakeYou.

### 5.4 YouTube policy and product review

YouTube's API and embedded-player policies are external platform requirements, not arbitrary product rules in this document. They can affect what an official API-client build may do. Recheck the current policy before releasing or materially changing an official YouTube API integration.

Relevant policy areas include API-client identity, user consent, minimum OAuth scopes, attribution, independent value, playback integrity, player behavior, advertising, data retention, and use of undocumented services.

The policy guide specifically discusses independent value for products that resemble YouTube experiences and identifies restrictions around changing standard player behavior, ads, and playback context. MakeYou should therefore document its independent value and submit an API Compliance Audit when the intended design is unclear.

Do not bury these trade-offs in implementation code. Keep a short, dated decision record for each integration mode, including what is supported, what is experimental, and what requires review. This plan is not legal advice.

## 6. Advanced features and quality-of-life roadmap

Advanced features should be considered as modules. Their availability may depend on the active discovery, playback, and enrichment providers.

### 6.1 Core player experience

- Play/pause, seek, volume, playback speed, fullscreen, and keyboard shortcuts.
- Queue and playlist navigation.
- Theater layout and compact/minimal player modes.
- Picture-in-picture when supported by the browser/player.
- Captions and subtitle selection when exposed by the active provider.
- Chapters and timestamps.
- Resume position and per-video playback preferences where available.
- Touch gestures and mobile-friendly controls.
- Media Session API integration where it works reliably.

### 6.2 SponsorBlock

Investigate SponsorBlock as an optional enrichment integration:

- Fetch segment metadata by video ID.
- Let users choose categories such as sponsor, intro, outro, self-promotion, and interaction reminders.
- Provide an enable/disable toggle and per-category controls.
- Show a timeline indicator and explain when a segment is skipped.
- Keep the data source and category visible.
- Do not submit segment reports automatically; any contribution flow must be a deliberate user action.

For each playback provider, test whether seeking over a segment is supported and whether the integration is appropriate for that mode. Do not assume an overlay/seek integration is automatically permitted in every official API-client configuration.

### 6.3 Return YouTube Dislike

Investigate an optional dislike-count enrichment provider:

- Keep it separate from YouTube Data API metadata.
- Label the source as community-provided or independently estimated.
- Do not present it as an official YouTube value.
- Handle missing, stale, or unavailable data without blocking playback.
- Do not replace or recalculate YouTube-provided statistics with this data.

### 6.4 Content and network controls

Explore privacy and content controls as separate layers:

- MakeYou-owned analytics and telemetry preferences.
- Optional blocking of MakeYou-owned non-essential requests.
- Per-provider privacy explanations and network diagnostics.
- Browser-extension integration for capabilities that require extension permissions.
- Native-wrapper integration for capabilities requiring OS-level controls.

A normal web page cannot install or control browser extensions, and it cannot inspect or rewrite the contents of a cross-origin YouTube iframe as if it were same-origin page content. Do not claim that a website-level filter controls requests or advertisements inside the official YouTube player. Any extension/native network-control feature must be designed, permissioned, and reviewed as a separate platform product. Its compatibility with YouTube API-client obligations must be assessed independently.

### 6.5 Local library and user customization

- Local watch history, disabled by default until the user enables it.
- Bookmarks, custom playlists, queues, and saved searches.
- Watch-later-style MakeYou lists, clearly distinguished from a user's private YouTube Watch Later list.
- Import/export of MakeYou settings and library data.
- Per-provider settings and preferred playback mode.
- Theme, accent, density, card layout, and sidebar customization.
- Optional synchronization across devices as a later account-backed feature.

## 7. Local-first data and privacy

Use browser storage for data that does not need to leave the user's device:

- IndexedDB for the local library, history, queues, cached metadata, and richer preferences.
- LocalStorage only for small simple preferences that need synchronous access.
- Cache Storage/service worker for the app shell and selected static assets, not for silently downloading or retaining full YouTube videos.
- Explicit cache limits, expiry, and a clear-data action.
- Export/import so the local library is portable.

MakeYou should be useful without requiring an account. Account sync is optional and should be introduced only when it adds a clear benefit.

If server-side user data is added, document what is stored, why it is stored, the retention period, account deletion, and how users can export their data. Keep provider data and MakeYou-owned data distinguishable.

## 8. Performance and compatibility

The project should prioritize low-end devices, Firefox, and real mobile browsers rather than optimizing only for a high-end Chromium desktop.

Principles:

- Keep the initial route lightweight and render useful content before client hydration where possible.
- Keep interactivity in focused client components.
- Do not mount video players in discovery grids.
- Load thumbnails lazily and reserve their aspect ratio.
- Use EngineImage for appropriate image work and preserve a native fallback.
- Keep search and provider requests bounded; debounce only where it improves UX and does not waste quota.
- Avoid unnecessary polling, large client-side dependencies, and animation loops.
- Use system font stacks unless a downloaded font materially improves the result.
- Respect reduced motion, keyboard navigation, focus visibility, and color contrast.
- Use pagination or incremental loading rather than rendering unbounded feeds.
- Measure JavaScript size, hydration cost, memory, long tasks, layout shift, image cost, and backend bandwidth.
- Test Firefox, Chromium, mobile Safari/Chrome, slow connections, and low-memory devices.

Performance budgets should be measured from real builds and then recorded in the repository. Do not invent a passing budget before collecting a baseline.

## 9. Kastrick Next.js Engine — Gen 3

MakeYou consumes the Engine as a package dependency. Engine source remains in its own repository.

Current selected Engine artifact:

- Repository: \`kastrick8/nextjs-engine\`
- Branch: \`main-3\`
- Selected source commit: \`3242b044a846babf9010e78be6b1e776619a3ae4\`
- Commit date: 2026-11-01
- Package version: \`3.0.0-alpha.1\`
- Release asset: \`nextjs-engine-3.0.0-alpha.1-3242b044a846babf9010e78be6b1e776619a3ae4.tgz\`
- SHA-256: \`75b4e75d1dd64c5c8892076c48b4d459540844362067865c8f9a39bad3f0e081\`
- Release asset path currently uses the \`channel-alpha-latest\` release tag.

The tarball filename and checksum identify the selected artifact. The \`channel-alpha-latest\` release tag itself is a rolling tag, so verify the asset and checksum whenever refreshing the dependency. Prefer a permanent commit-specific release URL if the Engine release workflow exposes one.

The selected Engine commit's reported CI/check suite was green when it was inspected. Gen 3 is still an alpha line: keep the integration isolated and expect API changes before a stable release.

Current MakeYou integration:

- \`next.config.js\` loads \`@kastrick/nextjs-engine/plugin\`.
- \`@kastrick/nextjs-engine\` is transpiled by Next.js.
- \`EngineImage\` is used for video thumbnails where appropriate.
- The official YouTube player remains an iframe in official mode.
- \`EngineVideo\` is reserved for native supported media sources; it is not a YouTube iframe substitute.

Upgrade process:

1. Inspect the latest \`main-3\` commit and its source/package version.
2. Check exact-commit CI and browser compatibility.
3. Verify the published release asset filename, size, and SHA-256.
4. Update the dependency pin and lockfile together.
5. Run type-check, build, and focused browser/player tests.
6. Keep a record of the Engine commit and artifact checksum used by each MakeYou deployment.

Do not push MakeYou-specific changes into the Engine repository. Engine source changes belong in the Engine project and should be consumed through a new verified package artifact.

## 10. Current implementation baseline

The following application pieces already exist and should be evolved rather than recreated without a reason:

- \`app/page.tsx\`: server-rendered homepage entry and initial public popular-video data.
- \`components/home/HomeExperience.tsx\`: client-side discovery experience, filters, search, URL import, and theme interaction.
- \`src/lib/youtube.ts\`: server-side YouTube Data API access and video normalization.
- \`app/api/videos/route.ts\`: same-origin discovery/search endpoint.
- \`src/lib/youtube-url.ts\`: YouTube URL and Android intent parsing.
- \`app/share/route.ts\`: PWA share-target intake and MakeYou watch-route redirect.
- \`app/watch/page.tsx\`: watch route using the official embedded YouTube player.
- \`app/manifest.ts\`: PWA manifest with Web Share Target configuration.
- \`app/globals.css\`: global visual system and responsive styling.
- \`next.config.js\`: Engine plugin, package transpilation, and image hosts.

The current app uses a public popularity feed, explicit search submission, a server-side API key, and the official iframe player. Treat this as the first provider implementation, not the final architecture ceiling.

## 11. Deployment and environment

Primary hosting: Vercel.

Expected environment variables:

- \`YOUTUBE_DATA_API_KEY\`: server-only YouTube Data API key for official discovery mode.
- \`YOUTUBE_REGION_CODE\`: optional region for supported public discovery queries; default \`IN\`.
- \`NEXT_PUBLIC_SITE_URL\`: canonical public origin for metadata and any client-safe URL construction, if adopted.
- OAuth secrets and provider credentials: server-side only, with names added when those integrations are implemented.

Do not commit real keys, tokens, OAuth client secrets, or user credentials. Use local \`.env.local\` for development and Vercel environment settings for deployment.

The app should continue to render its shell and useful local features when a provider is not configured. Show an informative state rather than fake content.

## 12. Delivery roadmap

### Milestone 1 — Stable application foundation

- Keep the responsive homepage and official watch route working.
- Verify search, popular feed, categories, playlist URLs, Shorts/live URLs, and share intake.
- Add robust loading, error, empty, and provider-unavailable states.
- Confirm the Gen 3 package can be installed and built in a clean environment.
- Add focused unit tests for URL parsing and provider response normalization.

### Milestone 2 — Client-first application shell

- Move user-facing filters, queue, navigation, and settings into clear client-side state.
- Add IndexedDB storage with schema versioning and migration handling.
- Add a local library for bookmarks, queues, saved searches, and opt-in history.
- Make the experience usable without signing in.
- Add import/export and clear-data controls.

### Milestone 3 — Provider abstraction

- Define discovery, playback, and enrichment contracts.
- Move existing YouTube Data API logic behind the discovery provider.
- Move official iframe creation and event handling behind the playback provider.
- Add capability flags and provider-status handling.
- Make components independent from provider response formats.

### Milestone 4 — Player quality of life

- Add keyboard shortcuts, playback preferences, chapter/timestamp handling, compact/theater layouts, queue controls, and browser-supported picture-in-picture.
- Add captions/subtitle selection where supported.
- Add media-session integration after testing browser behavior.
- Keep controls provider-aware and gracefully hide unsupported capabilities.

### Milestone 5 — Optional enrichment

- Prototype SponsorBlock metadata and per-category controls.
- Prototype Return YouTube Dislike or another community metadata source.
- Add clear source labels, failure handling, and user toggles.
- Review compatibility with the selected YouTube integration mode before enabling features in a public official API-client build.

### Milestone 6 — Experimental provider research

- Create a separate proof of concept for \`youtubei.js\`.
- Verify the current library, browser proxy setup, request types, and streaming path.
- Measure the bandwidth and execution cost of metadata and media proxying.
- Test Firefox, Chromium, mobile, captions, live streams, playlists, and playback edge cases.
- Document reliability and platform-policy implications before deciding whether it becomes a supported distribution mode.

### Milestone 7 — Account connection and optional sync

- Add Google Identity Services with minimum scopes and PKCE-based authorization.
- Implement account features only when their data/API support is verified.
- Add optional server-backed sync for MakeYou-owned library data.
- Provide disconnect, export, deletion, and retention controls.

### Milestone 8 — Extension/native exploration

- Evaluate whether extension or native-wrapper features provide enough value to justify separate builds.
- Identify required permissions and platform APIs before implementation.
- Keep the core website functional without these integrations.
- Make installation and permission grants explicit and revocable.

### Milestone 9 — Production readiness

- Review YouTube policy, OAuth, privacy, attribution, and provider terms for the exact release configuration.
- Complete Vercel environment configuration and clean-build checks.
- Test on Firefox, Chromium, Android browsers, and low-memory devices.
- Measure application performance and serverless bandwidth.
- Add monitoring for provider errors, quota exhaustion, and proxy health without collecting unnecessary personal data.
- Document recovery behavior when an upstream provider changes or becomes unavailable.

## 13. Acceptance criteria

The application foundation is ready when:

- The homepage renders a complete MakeYou interface without a configured API key.
- Official discovery loads real public results when the server-side key is configured.
- Search runs on deliberate user action and reports provider/quota failures clearly.
- URL import accepts supported YouTube URLs and Android intent formats without allowing arbitrary redirect targets.
- PWA share intake redirects valid shared videos/playlists into MakeYou.
- Discovery cards do not mount video players.
- Official mode uses the official YouTube embedded player.
- Provider-specific code is isolated behind adapters as the provider architecture is introduced.
- Local library features work without requiring an account.
- Sensitive keys and tokens never enter client bundles, URLs, or logs.
- The app remains usable when optional integrations fail or are disabled.
- The Engine dependency is traceable to a verified Gen 3 artifact.
- Firefox and lower-powered devices receive explicit compatibility testing.

An advanced module is ready when its provider capability, user controls, failure behavior, privacy implications, performance impact, and release status are documented and tested.

## 14. Reference documentation

### MakeYou and Engine

- MakeYou repository: https://github.com/Kate-alt-69/MakeYou
- Next.js Engine repository: https://github.com/kastrick8/nextjs-engine
- Engine package artifact: https://github.com/Kastrick8/nextjs-engine/releases/download/channel-alpha-latest/nextjs-engine-3.0.0-alpha.1-3242b044a846babf9010e78be6b1e776619a3ae4.tgz

### YouTube and Google

- YouTube Data API: https://developers.google.com/youtube/v3
- YouTube Data API quota: https://developers.google.com/youtube/v3/determine_quota_cost
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
- YouTube API Services Developer Policies: https://developers.google.com/youtube/terms/developer-policies
- YouTube Developer Policy Guide: https://developers.google.com/youtube/terms/developer-policies-guide
- Google Identity Services / OAuth for web: https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow

### Experimental and community integrations

- YouTube.js / InnerTube client: https://github.com/LuanRT/YouTube.js
- YouTube.js browser usage: https://ytjs.dev/guide/browser-usage
- SponsorBlock API documentation: https://wiki.sponsor.ajay.app/w/API_Docs

---

**Guiding idea:** MakeYou should be a fast, local-first, modular video client. Keep the browser in charge, keep the backend thin, make integrations replaceable, and let users choose their experience. Treat official, experimental, and separate-platform capabilities honestly so the product can evolve without hiding technical or policy trade-offs.
