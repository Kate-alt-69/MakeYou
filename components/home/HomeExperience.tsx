"use client";

import { EngineImage } from "@kastrick/nextjs-engine";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { parseYouTubeUrl, toWatchPath } from "@/lib/youtube-url";
import type { YouTubeVideo } from "@/lib/youtube";

const categories = [
  { label: "Popular", id: "" },
  { label: "Music", id: "10" },
  { label: "Gaming", id: "20" },
  { label: "Technology", id: "28" },
  { label: "News", id: "25" },
  { label: "Sports", id: "17" },
  { label: "Education", id: "27" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2 1-1.2 2.1-1.5-.5a8 8 0 0 1-1.6.9l-.3 1.6h-2.4l-.3-1.6a8 8 0 0 1-1.6-.9l-1.5.5-1.2-2.1 1.2-1a8 8 0 0 1 0-1.9l-1.2-1 1.2-2.1 1.5.5a8 8 0 0 1 1.6-.9l.3-1.6h2.4l.3 1.6a8 8 0 0 1 1.6.9l1.5-.5 1.2 2.1-1.2 1a8 8 0 0 1-.1 1.9Z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>,
    link: <><path d="M10 13.5a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 10.5a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg {...common}>{paths[name] || paths.more}</svg>;
}

function formatViews(value?: string) {
  if (!value) return "";
  const count = Number(value);
  if (!Number.isFinite(count)) return "";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(count) + " views";
}

function VideoCard({ video }: { video: YouTubeVideo }) {
  const thumbnail = video.thumbnails.high?.url || video.thumbnails.medium?.url || video.thumbnails.default?.url;
  return (
    <a className="video-card" href={`/watch?v=${encodeURIComponent(video.id)}`}>
      <div className="thumbnail">
        {thumbnail ? (
          <EngineImage src={thumbnail} alt="" width={480} height={270} aspectRatio="16/9" qualityPreset="performance" unoptimized />
        ) : <div className="thumbnail-fallback"><Icon name="play" size={28}/></div>}
        <span className="play-overlay"><Icon name="play" size={22}/></span>
      </div>
      <div className="video-meta">
        <div className="channel-avatar">{video.channelTitle.slice(0, 1).toUpperCase()}</div>
        <div className="video-copy">
          <h3>{video.title}</h3>
          <p>{video.channelTitle}</p>
          <p>{formatViews(video.viewCount)}{video.viewCount ? " · " : ""}{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""}</p>
        </div>
        <span className="card-more" aria-label="More options"><Icon name="more" size={18}/></span>
      </div>
    </a>
  );
}

export function HomeExperience({ initialVideos, initialConfigured, initialMessage = "" }: { initialVideos: YouTubeVideo[]; initialConfigured: boolean; initialMessage?: string }) {
  const firstLoad = useRef(true);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(initialConfigured);
  const [message, setMessage] = useState(initialMessage);
  const [dark, setDark] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("makeyou-theme");
    if (stored) setDark(stored === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    window.localStorage.setItem("makeyou-theme", dark ? "dark" : "light");
  }, [dark]);

  const loadVideos = useCallback(async (search: string, selectedCategory: string, signal: AbortSignal) => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (!search && selectedCategory) params.set("category", selectedCategory);
      const response = await fetch(`/api/videos?${params}`, { signal });
      const data = await response.json();
      setConfigured(data.configured !== false);
      setVideos(data.items || []);
      setMessage(data.message || "");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Couldn't load videos. Check your connection and try again.");
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
  };

  const importLink = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseYouTubeUrl(importValue);
    if (!parsed) {
      setMessage("That doesn't look like a supported YouTube video or playlist link.");
      return;
    }
    window.location.assign(toWatchPath(parsed));
  };

  const heading = useMemo(() => activeQuery ? `Results for “${activeQuery}”` : categories.find((item) => item.id === category)?.label === "Popular" ? "Popular right now" : `Popular in ${categories.find((item) => item.id === category)?.label}`, [activeQuery, category]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <a href="/" className="brand"><span className="brand-mark"><Icon name="play" size={18}/></span><span>MakeYou</span></a>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="/"><Icon name="home"/> <span>Home</span></a>
          <a className="nav-item" href="#discover"><Icon name="compass"/> <span>Explore</span></a>
          <a className="nav-item" href="#saved"><Icon name="bookmark"/> <span>Saved</span><span className="nav-soon">Soon</span></a>
          <a className="nav-item" href="#history"><Icon name="clock"/> <span>History</span><span className="nav-soon">Soon</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-dot"/> A lighter way to watch.</div>
          <a className="nav-item" href="#settings"><Icon name="settings"/> <span>Preferences</span></a>
          <p className="sidebar-foot">MakeYou is independent and not affiliated with YouTube or Google.</p>
        </div>
      </aside>

      {mobileMenu && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)}/>}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}><Icon name="menu"/></button>
          <a href="/" className="mobile-brand"><span className="brand-mark"><Icon name="play" size={16}/></span>MakeYou</a>
          <form className="search-box" onSubmit={submitSearch}>
            <Icon name="search" size={19}/>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos, channels..." aria-label="Search videos"/>
            {query && <button className="search-clear" type="button" onClick={() => { setQuery(""); setActiveQuery(""); }} aria-label="Clear search">×</button>}
            <button type="submit" className="search-submit">Search</button>
          </form>
          <div className="top-actions">
            <button className="icon-button" title="Import a YouTube link" aria-label="Import a YouTube link" onClick={() => setImportOpen(true)}><Icon name="link"/></button>
            <button className="icon-button" title={dark ? "Switch to light theme" : "Switch to dark theme"} aria-label="Toggle theme" onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"}/></button>
            <button className="account-button" onClick={() => setImportOpen(true)} title="Open link or connect account"> <span className="account-avatar">M</span><span className="account-label">Get started</span></button>
          </div>
        </header>

        <section className="content" id="discover">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR VIDEO SPACE</p>
              <h1>Watch what <span>moves you.</span></h1>
              <p className="welcome-sub">A cleaner way to find your next favourite video.</p>
            </div>
            <button className="import-cta" onClick={() => setImportOpen(true)}><Icon name="link" size={17}/> Open a video link</button>
          </div>

          <div className="category-row" role="tablist" aria-label="Video categories">
            {categories.map((item) => (
              <button key={item.id || "all"} role="tab" aria-selected={category === item.id && !activeQuery} className={category === item.id && !activeQuery ? "category-chip selected" : "category-chip"} onClick={() => { setActiveQuery(""); setQuery(""); setCategory(item.id); }}>{item.label}</button>
            ))}
          </div>

          <div className="section-heading">
            <div><h2>{heading}</h2><p>{activeQuery ? "Search results from YouTube" : "A snapshot of what's getting watched"}</p></div>
            <span className="live-label"><span/> LIVE DISCOVERY</span>
          </div>

          {loading ? (
            <div className="video-grid" aria-label="Loading videos">
              {Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-thumb"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>)}
            </div>
          ) : !configured ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="play" size={26}/></div>
              <h3>MakeYou is ready for videos.</h3>
              <p>Add a YouTube Data API key to load live discovery and search results. The key stays on the server.</p>
              <code>YOUTUBE_DATA_API_KEY=your_key</code>
              <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">Set up YouTube Data API <span>↗</span></a>
            </div>
          ) : message && videos.length === 0 ? (
            <div className="empty-state compact"><h3>{message}</h3><p>Try again in a moment, or choose another category.</p><button className="secondary-button" onClick={() => setCategory(category)}>Retry</button></div>
          ) : videos.length === 0 ? (
            <div className="empty-state compact"><h3>No videos found.</h3><p>Try a different search.</p></div>
          ) : (
            <div className="video-grid">
              {videos.map((video) => <VideoCard video={video} key={video.id}/>)}
            </div>
          )}

          <footer className="content-footer"><span>Made for the joy of watching.</span><span>MakeYou · Independent video client</span></footer>
        </section>
      </main>

      {importOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setImportOpen(false); }}>
          <section className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
            <button className="modal-close" onClick={() => setImportOpen(false)} aria-label="Close">×</button>
            <div className="modal-icon"><Icon name="link" size={22}/></div>
            <p className="eyebrow">JUMP RIGHT IN</p>
            <h2 id="import-title">Open a video</h2>
            <p>Paste a YouTube video, Shorts, live, or playlist link. Shared Android links work too.</p>
            <form onSubmit={importLink}>
              <input autoFocus value={importValue} onChange={(event) => setImportValue(event.target.value)} placeholder="https://youtu.be/..." aria-label="YouTube URL"/>
              <button type="submit" className="primary-button">Open video <Icon name="play" size={16}/></button>
            </form>
            <span className="modal-hint">MakeYou opens the official embedded player.</span>
          </section>
        </div>
      )}
    </div>
  );
}
