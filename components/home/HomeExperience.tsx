"use client";

import { EngineDialog, EngineImage, EnginePopover } from "@kastrick/nextjs-engine";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { parseYouTubeUrl, toWatchPath } from "@/lib/youtube-url";
import type { YouTubeVideo } from "@/lib/youtube";

const categories = [
  { label: "All", id: "" },
  { label: "Music", id: "10" },
  { label: "Gaming", id: "20" },
  { label: "Technology", id: "28" },
  { label: "News", id: "25" },
  { label: "Sports", id: "17" },
  { label: "Education", id: "27" },
];

const navigation = [
  { label: "Home", icon: "home" },
  { label: "Shorts", icon: "shorts" },
  { label: "Subscriptions", icon: "subscriptions" },
];

const libraryNavigation = [
  { label: "You", icon: "user" },
  { label: "History", icon: "history" },
  { label: "Playlists", icon: "playlist" },
  { label: "Watch later", icon: "clock" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    shorts: <><path d="m14.5 3.5 5 2.9a2.3 2.3 0 0 1-2.3 4L7 4.2a2.3 2.3 0 0 0-2.3 4l12.1 7a2.3 2.3 0 0 1-2.3 4l-5-2.9"/><path d="m9.5 20.5-5-2.9a2.3 2.3 0 0 1 2.3-4l10.2 5.9a2.3 2.3 0 0 0 2.3-4"/></>,
    subscriptions: <><rect x="3" y="5" width="18" height="14"/><path d="m10 9 5 3-5 3z"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    playlist: <><path d="M4 5h15M4 10h15M4 15h8"/><path d="m17 14 4 2.5-4 2.5z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    link: <><path d="M10 13.5a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 10.5a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };

  return <svg {...common}>{paths[name] ?? paths.play}</svg>;
}

function formatViews(value?: string) {
  if (!value) return "";
  const count = Number(value);
  if (!Number.isFinite(count)) return "";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(count) + " views";
}

function VideoCard({ video }: { video: YouTubeVideo }) {
  const thumbnail = video.thumbnails.high?.url || video.thumbnails.medium?.url || video.thumbnails.default?.url;
  const stats = [formatViews(video.viewCount), video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="video-card">
      <a className="thumbnail-link" href={"/watch?v=" + encodeURIComponent(video.id)} aria-label={"Watch " + video.title}>
        <div className="thumbnail">
          {thumbnail ? (
            <EngineImage
              src={thumbnail}
              alt=""
              width={480}
              height={270}
              qualityPreset="performance"
              loading="lazy"
              unoptimized
              rounded={false}
              className="thumbnail-engine-image"
            />
          ) : <div className="thumbnail-fallback"><Icon name="play" size={26}/></div>}
          <span className="video-duration" aria-hidden="true"> </span>
        </div>
      </a>
      <div className="video-meta">
        <div className="channel-avatar" aria-hidden="true">{video.channelTitle.slice(0, 1).toUpperCase()}</div>
        <div className="video-copy">
          <a href={"/watch?v=" + encodeURIComponent(video.id)} className="video-title">{video.title}</a>
          <p className="channel-name">{video.channelTitle}</p>
          {stats && <p className="video-stats">{stats}</p>}
        </div>
      </div>
    </article>
  );
}

export function HomeExperience({
  initialVideos,
  initialConfigured,
  initialMessage = "",
}: {
  initialVideos: YouTubeVideo[];
  initialConfigured: boolean;
  initialMessage?: string;
}) {
  const firstLoad = useRef(true);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(initialConfigured);
  const [message, setMessage] = useState(initialMessage);
  const [activeNavigation, setActiveNavigation] = useState("Home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState("");

  const loadVideos = useCallback(async (search: string, selectedCategory: string, signal: AbortSignal) => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (!search && selectedCategory) params.set("category", selectedCategory);
      const response = await fetch("/api/videos?" + params.toString(), { signal });
      const data = await response.json();
      setConfigured(data.configured !== false);
      setVideos(data.items || []);
      setMessage(data.message || "");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Could not load videos. Check your connection and try again.");
      setVideos([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const controller = new AbortController();
    void loadVideos(activeQuery, category, controller.signal);
    return () => controller.abort();
  }, [activeQuery, category, loadVideos]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setCategory("");
    setActiveQuery(query.trim());
    setActiveNavigation("Home");
  };

  const importLink = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseYouTubeUrl(importValue);
    if (!parsed) {
      setImportError("Enter a valid YouTube video or playlist link.");
      return;
    }
    window.location.assign(toWatchPath(parsed));
  };

  const chooseNavigation = (label: string) => {
    setActiveNavigation(label);
    if (label !== "Home") {
      setMessage(label + " is part of the preview. This section is not connected yet.");
      setVideos([]);
      setActiveQuery("");
      setQuery("");
    } else {
      setMessage("");
      setCategory("");
      setActiveQuery("");
      setQuery("");
    }
  };

  const heading = activeQuery
    ? "Results for “" + activeQuery + "”"
    : categories.find((item) => item.id === category)?.label === "All"
      ? "Popular videos"
      : "Popular in " + (categories.find((item) => item.id === category)?.label ?? "All");

  return (
    <div className={"app-shell" + (sidebarCollapsed ? " sidebar-collapsed" : "")}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <a href="/" className="brand" aria-label="MakeYou home">
            <span className="brand-mark"><Icon name="play" size={14}/></span>
            <span>MakeYou</span>
          </a>
        </div>
        <nav className="side-nav" aria-label="YouTube-style navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.label}
              className={"nav-item" + (activeNavigation === item.label ? " active" : "")}
              aria-current={activeNavigation === item.label ? "page" : undefined}
              onClick={() => chooseNavigation(item.label)}
            >
              <Icon name={item.icon} size={19}/>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-separator"/>
        <div className="sidebar-section-label">YOU</div>
        <nav className="side-nav side-nav-secondary" aria-label="Your library">
          {libraryNavigation.map((item) => (
            <button
              type="button"
              key={item.label}
              className={"nav-item" + (activeNavigation === item.label ? " active" : "")}
              aria-current={activeNavigation === item.label ? "page" : undefined}
              onClick={() => chooseNavigation(item.label)}
            >
              <Icon name={item.icon} size={18}/>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="preview-indicator">PREVIEW BUILD</span>
          <p>Independent video client</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="header-icon menu-toggle"
            aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            <Icon name="menu" size={19}/>
          </button>

          <form className="search-box" onSubmit={submitSearch}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search YouTube videos"
            />
            {query && (
              <button type="button" className="search-clear" onClick={() => { setQuery(""); setActiveQuery(""); }} aria-label="Clear search">
                <Icon name="close" size={16}/>
              </button>
            )}
            <button type="submit" className="search-submit" aria-label="Search">
              <Icon name="search" size={18}/>
            </button>
          </form>

          <div className="top-actions">
            <button
              type="button"
              className="header-icon import-action"
              title="Open a video link"
              aria-label="Open a video link"
              onClick={() => { setImportError(""); setImportOpen(true); }}
            >
              <Icon name="link" size={18}/>
            </button>
            <span className="preview-label">PREVIEW</span>
            <EnginePopover
              trigger={<span className="account-glyph" aria-hidden="true"><Icon name="user" size={20}/></span>}
              triggerAriaLabel="Account menu"
              triggerClassName="account-trigger"
              triggerStyle={{ borderRadius: 0, width: 36, height: 36, padding: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--text)" }}
              placement="bottom"
              align="end"
              offset={6}
              className="account-popover"
              style={{ width: 240, minWidth: 240, padding: 0, borderRadius: 0, background: "#252526", border: "1px solid #3c3c3c", color: "#cccccc", boxShadow: "none" }}
            >
              <div className="account-menu">
                <div className="account-summary">
                  <span className="account-summary-icon"><Icon name="user" size={18}/></span>
                  <span><strong>Guest</strong><small>Preview account</small></span>
                </div>
                <div className="account-menu-separator"/>
                <div className="account-menu-note">Account connection is not enabled in this preview.</div>
              </div>
            </EnginePopover>
          </div>
        </header>

        <section className="content" id="home">
          <div className="category-row" role="tablist" aria-label="Video categories">
            {categories.map((item) => {
              const selected = category === item.id && !activeQuery && activeNavigation === "Home";
              return (
                <button
                  type="button"
                  role="tab"
                  key={item.id || "all"}
                  aria-selected={selected}
                  className={"category-chip" + (selected ? " selected" : "")}
                  onClick={() => {
                    setActiveNavigation("Home");
                    setActiveQuery("");
                    setQuery("");
                    setCategory(item.id);
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="section-heading">
            <h1>{activeNavigation === "Home" ? heading : activeNavigation}</h1>
            <span className="result-count">{loading ? "LOADING" : videos.length + " VIDEOS"}</span>
          </div>

          {loading ? (
            <div className="video-grid" aria-label="Loading videos">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="skeleton-card" key={index}>
                  <div className="skeleton-thumb"/>
                  <div className="skeleton-meta"><span/><i/><i/></div>
                </div>
              ))}
            </div>
          ) : !configured && activeNavigation === "Home" ? (
            <div className="empty-state">
              <h2>MakeYou preview</h2>
              <p>Add a YouTube Data API key to load public discovery and search results. The key stays on the server.</p>
              <code>YOUTUBE_DATA_API_KEY=your_key</code>
              <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">Configure YouTube Data API ↗</a>
            </div>
          ) : message && videos.length === 0 ? (
            <div className="empty-state">
              <h2>{message}</h2>
              <p>Use Home to return to video discovery.</p>
              <button type="button" className="text-button" onClick={() => chooseNavigation("Home")}>Go to Home</button>
            </div>
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <h2>No videos found</h2>
              <p>Try another search or choose a different category.</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map((video) => <VideoCard video={video} key={video.id}/>)}
            </div>
          )}

          <footer className="content-footer">
            <span>MakeYou · Independent video client</span>
            <span>Preview build · Not affiliated with YouTube or Google</span>
          </footer>
        </section>
      </main>

      <EngineDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Open a video"
        description="Paste a YouTube video, Shorts, live, or playlist URL."
        ariaLabel="Open a video"
        showCloseButton
        closeOnBackdrop
        closeOnEscape
        duration={0}
        className="import-dialog"
        style={{ width: "min(460px, calc(100vw - 32px))", maxWidth: "460px", padding: "20px", borderRadius: 0, background: "#252526", border: "1px solid #3c3c3c", color: "#cccccc", boxShadow: "none" }}
        overlayStyle={{ background: "rgba(0,0,0,.55)", backdropFilter: "none" }}
      >
        <form className="import-form" onSubmit={importLink}>
          <label htmlFor="video-url">Video or playlist URL</label>
          <input
            id="video-url"
            autoFocus
            value={importValue}
            onChange={(event) => { setImportValue(event.target.value); setImportError(""); }}
            placeholder="https://youtu.be/..."
          />
          {importError && <p className="form-error" role="alert">{importError}</p>}
          <div className="import-actions">
            <button type="button" className="text-button" onClick={() => setImportOpen(false)}>Cancel</button>
            <button type="submit" className="primary-button">Open video</button>
          </div>
        </form>
      </EngineDialog>
    </div>
  );
}
