"use client";

import { useEffect, useMemo, useState } from "react";
import {
  architectureNotes,
  getDailyBrief,
  getMarket,
  getStories,
  getUiCopy,
  markets,
  schemaTables,
  setupDecisions,
  type BrieflySource,
  type BrieflyStory,
  type MarketCode,
} from "@/lib/briefly";
import type { HomepageData } from "@/lib/supabase-data";

type ViewName = "home" | "brief" | "sources" | "operator" | "editorial" | "studio";
type SourceFilter = "all" | "official" | "needs-feed" | "active";

type IngestionResult = {
  plannedSources: number;
  results: Array<{
    source: string;
    status: string;
    recordsFound?: number;
    recordsImported?: number;
    error?: string;
  }>;
};

type AppState = {
  market: MarketCode;
  progress: Record<MarketCode, number>;
  completed: Record<MarketCode, number>;
  savedStoryIds: string[];
  profile: string[];
};

const defaultState: AppState = {
  market: "BG",
  progress: { BG: 0, RS: 0 },
  completed: { BG: 0, RS: 0 },
  savedStoryIds: [],
  profile: [],
};

const storageKey = "briefly-state-v2";
const wordmarkKey = "briefly-wordmark-seen-v2";

function loadStoredState(): AppState {
  if (typeof window === "undefined") return defaultState;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    return {
      ...defaultState,
      ...parsed,
      progress: { ...defaultState.progress, ...(parsed.progress ?? {}) },
      completed: { ...defaultState.completed, ...(parsed.completed ?? {}) },
      savedStoryIds: Array.isArray(parsed.savedStoryIds)
        ? parsed.savedStoryIds
        : [],
      profile: Array.isArray(parsed.profile) ? parsed.profile : [],
    };
  } catch {
    return defaultState;
  }
}

function formatDate(marketCode: MarketCode) {
  const market = getMarket(marketCode);
  return new Intl.DateTimeFormat(market.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: market.timezone,
  }).format(new Date());
}

function formatTime(marketCode: MarketCode, value: string) {
  const market = getMarket(marketCode);
  return new Intl.DateTimeFormat(market.locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: market.timezone,
  }).format(new Date(value));
}

function greetingForHour(marketCode: MarketCode) {
  const market = getMarket(marketCode);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: market.timezone,
    }).format(new Date()),
  );

  if (marketCode === "RS") {
    if (hour < 12) return "Dobro jutro";
    if (hour < 18) return "Dobar dan";
    return "Dobro veče";
  }

  if (hour < 12) return "Добро утро";
  if (hour < 18) return "Добър ден";
  return "Добър вечер";
}

function sourceText(marketCode: MarketCode, sourceCount: number) {
  const copy = getUiCopy(marketCode);
  return sourceCount === 1 ? copy.oneSource : copy.sourceCount;
}

function meaningForProfile(story: BrieflyStory, profile: string[]) {
  const meanings = story.meansForMe as Record<string, string>;
  const matchedProfile = profile.find((item) => meanings[item]);
  if (matchedProfile) {
    return `${matchedProfile}: ${meanings[matchedProfile]}`;
  }

  return meanings.default;
}

export default function BrieflyApp({
  homepageData,
}: {
  homepageData: HomepageData;
}) {
  const [state, setState] = useState<AppState>(defaultState);
  const [view, setView] = useState<ViewName>("home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [studioStoryId, setStudioStoryId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [ingestionToken, setIngestionToken] = useState("");
  const [ingestionRunning, setIngestionRunning] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [ingestionError, setIngestionError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const market = getMarket(state.market);
  const copy = getUiCopy(state.market);
  const dailyBrief = getDailyBrief(state.market);
  const stories = getStories(state.market);
  const storyIndex = Math.min(
    Math.max(state.progress[state.market] ?? 0, 0),
    stories.length - 1,
  );
  const activeStory = stories[storyIndex];
  const completedCount = Math.min(
    state.completed[state.market] ?? 0,
    stories.length,
  );
  const selectedStudioStory =
    stories.find((story) => story.id === studioStoryId) ?? stories[0];

  const sourceRows = useMemo(
    () =>
      homepageData.sources.filter(
        (source): source is BrieflySource => source.market === state.market,
      ),
    [homepageData.sources, state.market],
  );
  const filteredSourceRows = useMemo(() => {
    if (sourceFilter === "official") {
      return sourceRows.filter((source) => source.official);
    }

    if (sourceFilter === "needs-feed") {
      return sourceRows.filter((source) => !source.feedUrl);
    }

    if (sourceFilter === "active") {
      return sourceRows.filter((source) => source.active);
    }

    return sourceRows;
  }, [sourceFilter, sourceRows]);
  const sourceStats = useMemo(
    () => ({
      total: sourceRows.length,
      official: sourceRows.filter((source) => source.official).length,
      active: sourceRows.filter((source) => source.active).length,
      needsFeed: sourceRows.filter((source) => !source.feedUrl).length,
    }),
    [sourceRows],
  );
  const sourceFilters: Array<[SourceFilter, string, number]> = [
    ["all", "All", sourceStats.total],
    ["official", "Official", sourceStats.official],
    ["needs-feed", "Needs feed", sourceStats.needsFeed],
    ["active", "Active", sourceStats.active],
  ];
  const operatorStats = useMemo(
    () => ({
      allSources: homepageData.sources.length,
      readyFeeds: homepageData.sources.filter(
        (source) =>
          source.active &&
          Boolean(source.feedUrl) &&
          source.verificationStatus === "verified_feed",
      ).length,
      inactiveSources: homepageData.sources.filter((source) => !source.active).length,
    }),
    [homepageData.sources],
  );

  useEffect(() => {
    setState(loadStoredState());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion || window.localStorage.getItem(wordmarkKey)) return;

    setShowSplash(true);
    window.localStorage.setItem(wordmarkKey, "true");
    const timeout = window.setTimeout(() => setShowSplash(false), 2400);
    return () => window.clearTimeout(timeout);
  }, []);

  function updateState(nextState: Partial<AppState>) {
    setState((current) => ({ ...current, ...nextState }));
  }

  function setStoryIndex(nextIndex: number) {
    updateState({
      progress: {
        ...state.progress,
        [state.market]: Math.min(Math.max(nextIndex, 0), stories.length - 1),
      },
    });
    setOpenStoryId(null);
  }

  function startBrief() {
    updateState({
      progress: { ...state.progress, [state.market]: 0 },
      completed: { ...state.completed, [state.market]: 0 },
    });
    setOpenStoryId(null);
    setView("brief");
  }

  function nextStory() {
    const isLast = storyIndex === stories.length - 1;
    updateState({
      completed: {
        ...state.completed,
        [state.market]: isLast
          ? stories.length
          : Math.max(completedCount, storyIndex + 1),
      },
      progress: {
        ...state.progress,
        [state.market]: isLast ? storyIndex : storyIndex + 1,
      },
    });
    setOpenStoryId(null);
  }

  function toggleSaved(storyId: string) {
    updateState({
      savedStoryIds: state.savedStoryIds.includes(storyId)
        ? state.savedStoryIds.filter((id) => id !== storyId)
        : [...state.savedStoryIds, storyId],
    });
  }

  function toggleProfileOption(option: string) {
    updateState({
      profile: state.profile.includes(option)
        ? state.profile.filter((item) => item !== option)
        : [...state.profile, option],
    });
  }

  async function shareStory(story: BrieflyStory) {
    const shareText = `${story.headline}\n\n${story.description}\n\nBriefly`;
    if (navigator.share) {
      await navigator.share({ title: story.headline, text: shareText });
      return;
    }
    await navigator.clipboard?.writeText(shareText);
  }

  async function runIngestion() {
    const token = ingestionToken.trim();
    if (!token) {
      setIngestionError("Enter the ingestion token first.");
      return;
    }

    setIngestionRunning(true);
    setIngestionError(null);
    setIngestionResult(null);

    try {
      const response = await fetch("/api/ingestion/rss", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Ingestion request failed.",
        );
      }

      setIngestionResult(payload as IngestionResult);
    } catch (error) {
      setIngestionError(
        error instanceof Error ? error.message : "Ingestion request failed.",
      );
    } finally {
      setIngestionRunning(false);
    }
  }

  const tabs: Array<[ViewName, string]> = [
    ["home", copy.tabHome],
    ["brief", copy.tabBrief],
    ["sources", copy.tabSources],
    ["operator", "Operator"],
    ["editorial", copy.tabEditorial],
    ["studio", copy.tabStudio],
  ];

  return (
    <>
      <Splash visible={showSplash} />
      <div className="app-shell">
        <header className="topbar">
          <button
            className="brand-button"
            type="button"
            onClick={() => setView("home")}
          >
            <span className="brand-mark" aria-hidden="true">
              B
            </span>
            <span className="brand-copy">
              <strong>Briefly</strong>
              <span>{market.tagline}</span>
            </span>
          </button>

          <label className="market-switcher">
            <span>{copy.marketLabel}</span>
            <select
              value={state.market}
              aria-label="Select market"
              onChange={(event) => {
                updateState({ market: event.target.value as MarketCode });
                setOpenStoryId(null);
                setStudioStoryId(null);
              }}
            >
              {markets.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <nav className="section-tabs" aria-label="Briefly sections">
          {tabs.map(([tabView, label]) => (
            <button
              key={tabView}
              className={view === tabView ? "tab is-active" : "tab"}
              type="button"
              onClick={() => setView(tabView)}
            >
              {label}
            </button>
          ))}
        </nav>

        <main>
          {view === "home" && (
            <section className="view is-active">
              <div className="brief-hero">
                <div>
                  <p className="quiet">
                    {formatDate(state.market)} · {market.label}
                  </p>
                  <h1>{greetingForHour(state.market)}</h1>
                  <p className="hero-subtitle">{market.dailyTitle}</p>
                </div>

                <div className="brief-summary" aria-live="polite">
                  <div>
                    <span>{stories.length}</span>
                    <small>{copy.storiesLabel}</small>
                  </div>
                  <div>
                    <span>{dailyBrief.estimatedMinutes}</span>
                    <small>{copy.minutesLabel}</small>
                  </div>
                  <div>
                    <span>{completedCount}</span>
                    <small>{copy.completedLabel}</small>
                  </div>
                </div>
              </div>

              <div className="home-actions">
                <button className="primary-action" type="button" onClick={startBrief}>
                  {copy.startBrief}
                </button>
                {completedCount > 0 && (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setView("brief")}
                  >
                    {copy.continueBrief}
                  </button>
                )}
              </div>

              <div className="progress-track" aria-label="Daily brief progress">
                <span
                  style={{
                    width: `${Math.round((completedCount / stories.length) * 100)}%`,
                  }}
                />
              </div>

              <section className="personal-card" aria-labelledby="personal-title">
                <div>
                  <p className="eyebrow">{copy.personalEyebrow}</p>
                  <h2 id="personal-title">{copy.personalTitle}</h2>
                  <p>{copy.personalCopy}</p>
                </div>
                <button
                  className="text-action"
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                >
                  {copy.editProfile}
                </button>
              </section>

              {profileOpen && (
                <form className="profile-panel">
                  <fieldset>
                    <legend>{copy.profileLegend}</legend>
                    <div className="chip-grid">
                      {market.profileOptions.map((option) => (
                        <label className="profile-chip" key={option}>
                          <input
                            type="checkbox"
                            checked={state.profile.includes(option)}
                            onChange={() => toggleProfileOption(option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="form-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => updateState({ profile: [] })}
                    >
                      {copy.deleteProfile}
                    </button>
                    <button
                      className="primary-action"
                      type="button"
                      onClick={() => setProfileOpen(false)}
                    >
                      {copy.saveProfile}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {view === "brief" && (
            <section className="view is-active">
              <div className="brief-toolbar">
                <p className="quiet">
                  {copy.storyPosition} {storyIndex + 1} {copy.of} {stories.length}
                </p>
                <div className="brief-dots" aria-label="Story progress">
                  {stories.map((story, index) => (
                    <button
                      key={story.id}
                      className={index === storyIndex ? "dot is-active" : "dot"}
                      type="button"
                      aria-label={`${copy.storyPosition} ${index + 1}`}
                      onClick={() => setStoryIndex(index)}
                    />
                  ))}
                </div>
              </div>

              <div
                className="story-stage"
                aria-live="polite"
                onTouchStart={(event) =>
                  setTouchStartX(event.changedTouches[0].screenX)
                }
                onTouchEnd={(event) => {
                  if (touchStartX === null) return;
                  const delta = event.changedTouches[0].screenX - touchStartX;
                  if (Math.abs(delta) < 50) return;
                  if (delta < 0) nextStory();
                  if (delta > 0) setStoryIndex(storyIndex - 1);
                  setTouchStartX(null);
                }}
              >
                <StoryCard
                  copy={copy}
                  marketCode={state.market}
                  story={activeStory}
                  isSaved={state.savedStoryIds.includes(activeStory.id)}
                  isOpen={openStoryId === activeStory.id}
                  profile={state.profile}
                  onSave={() => toggleSaved(activeStory.id)}
                  onShare={() => void shareStory(activeStory)}
                  onOpen={() =>
                    setOpenStoryId((current) =>
                      current === activeStory.id ? null : activeStory.id,
                    )
                  }
                />
              </div>

              <div className="brief-controls">
                <button
                  className="secondary-action"
                  type="button"
                  disabled={storyIndex === 0}
                  onClick={() => setStoryIndex(storyIndex - 1)}
                >
                  {copy.previous}
                </button>
                <button className="primary-action" type="button" onClick={nextStory}>
                  {storyIndex === stories.length - 1 ? copy.completedTitle : copy.next}
                </button>
              </div>

              {completedCount >= stories.length && (
                <section className="completion-state">
                  <h2>{copy.completedTitle}</h2>
                  <p>{copy.completedCopy}</p>
                  <button
                    className="text-action"
                    type="button"
                    onClick={() =>
                      updateState({
                        progress: { ...state.progress, [state.market]: 0 },
                        completed: { ...state.completed, [state.market]: 0 },
                      })
                    }
                  >
                    {copy.restart}
                  </button>
                </section>
              )}
            </section>
          )}

          {view === "sources" && (
            <section className="view is-active">
              <div className="section-heading">
                <p className="eyebrow">{copy.sourcesEyebrow}</p>
                <h1>{copy.sourcesTitle}</h1>
                <p>
                  Manage the sources that Briefly can use for this market. Data is
                  loaded from {homepageData.source === "supabase" ? "Supabase" : "seed data"}.
                </p>
              </div>

              <section className="source-dashboard" aria-label="Source management">
                <div className="source-stat">
                  <strong>{sourceStats.total}</strong>
                  <span>Total sources</span>
                </div>
                <div className="source-stat">
                  <strong>{sourceStats.official}</strong>
                  <span>Official</span>
                </div>
                <div className="source-stat">
                  <strong>{sourceStats.needsFeed}</strong>
                  <span>Need feed check</span>
                </div>
                <div className="source-stat">
                  <strong>{sourceStats.active}</strong>
                  <span>Active</span>
                </div>
              </section>

              <div className="source-controls" aria-label="Source filters">
                {sourceFilters.map(([filter, label, count]) => (
                  <button
                    key={filter}
                    className={
                      sourceFilter === filter
                        ? "source-filter is-active"
                        : "source-filter"
                    }
                    type="button"
                    onClick={() => setSourceFilter(filter)}
                  >
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </button>
                ))}
              </div>

              <div className="source-list">
                {filteredSourceRows.map((source) => (
                  <article className="source-row" key={`${source.market}-${source.name}`}>
                    <div>
                      <h2>{source.name}</h2>
                      <p>
                        {source.category}
                        {"official" in source && source.official
                          ? ` · ${copy.official}`
                          : ""}
                      </p>
                    </div>
                    <div className="source-status">
                      <strong>{source.active ? copy.active : copy.inactive}</strong>
                      <span>{source.feedUrl ?? copy.noFeed}</span>
                      <small>{source.verificationStatus}</small>
                    </div>
                    <a
                      className="source-link"
                      href={source.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Review
                    </a>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === "editorial" && (
            <section className="view is-active">
              <div className="section-heading">
                <p className="eyebrow">Phase 1</p>
                <h1>{copy.editorialTitle}</h1>
              </div>
              <div className="editorial-grid">
                <InfoList title={copy.architectureTitle} items={architectureNotes} />
                <InfoList title={copy.decisionsTitle} items={setupDecisions} />
                <InfoList title={copy.schemaTitle} items={schemaTables} />
              </div>
            </section>
          )}

          {view === "operator" && (
            <section className="view is-active">
              <div className="section-heading">
                <p className="eyebrow">Operations</p>
                <h1>Operator</h1>
                <p>Run source ingestion and check the latest result.</p>
              </div>

              <section className="operator-panel" aria-label="Ingestion controls">
                <div className="operator-grid">
                  <div className="operator-stat">
                    <strong>{operatorStats.allSources}</strong>
                    <span>Sources</span>
                  </div>
                  <div className="operator-stat">
                    <strong>{operatorStats.readyFeeds}</strong>
                    <span>Ready feeds</span>
                  </div>
                  <div className="operator-stat">
                    <strong>{operatorStats.inactiveSources}</strong>
                    <span>Inactive</span>
                  </div>
                </div>

                <div className="operator-form">
                  <label>
                    <span>Ingestion token</span>
                    <input
                      type="password"
                      value={ingestionToken}
                      placeholder="Paste token"
                      autoComplete="off"
                      onChange={(event) => setIngestionToken(event.target.value)}
                    />
                  </label>
                  <button
                    className="primary-action"
                    type="button"
                    disabled={ingestionRunning}
                    onClick={() => void runIngestion()}
                  >
                    {ingestionRunning ? "Running..." : "Run RSS ingestion"}
                  </button>
                </div>

                {ingestionError && (
                  <p className="operator-error" role="alert">
                    {ingestionError}
                  </p>
                )}

                {ingestionResult && (
                  <section className="operator-result" aria-live="polite">
                    <div className="operator-result-head">
                      <h2>Last run</h2>
                      <span>{ingestionResult.plannedSources} planned</span>
                    </div>
                    <div className="operator-list">
                      {ingestionResult.results.map((result) => (
                        <article
                          className="operator-run"
                          key={`${result.source}-${result.status}`}
                        >
                          <div>
                            <h3>{result.source}</h3>
                            <p>{result.error ?? result.status}</p>
                          </div>
                          <span className="status-pill">{result.status}</span>
                          <small>
                            {result.recordsFound ?? 0} found ·{" "}
                            {result.recordsImported ?? 0} imported
                          </small>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </section>
            </section>
          )}

          {view === "studio" && (
            <section className="view is-active">
              <div className="section-heading">
                <p className="eyebrow">AI Studio</p>
                <h1>{copy.studioTitle}</h1>
              </div>
              <div className="studio-layout">
                <label>
                  <span>{copy.selectStory}</span>
                  <select
                    value={selectedStudioStory.id}
                    onChange={(event) => setStudioStoryId(event.target.value)}
                  >
                    {stories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.headline}
                      </option>
                    ))}
                  </select>
                </label>
                <StudioOutput
                  copy={copy}
                  story={selectedStudioStory}
                  marketCode={state.market}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

function Splash({ visible }: { visible: boolean }) {
  return (
    <div className={visible ? "splash is-visible" : "splash"} aria-hidden="true">
      <div className="splash-cloud">
        <span>Politics</span>
        <span>Economy</span>
        <span>Technology</span>
        <span>World</span>
        <span>Business</span>
        <span>Health</span>
      </div>
      <div className="splash-wordmark">Briefly</div>
      <p>Everything important. Briefly.</p>
    </div>
  );
}

function StoryCard({
  story,
  marketCode,
  copy,
  isSaved,
  isOpen,
  profile,
  onSave,
  onShare,
  onOpen,
}: {
  story: BrieflyStory;
  marketCode: MarketCode;
  copy: ReturnType<typeof getUiCopy>;
  isSaved: boolean;
  isOpen: boolean;
  profile: string[];
  onSave: () => void;
  onShare: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="story-card">
      <div className="story-image">
        <img className="story-img" src={story.image} alt="" />
        <span className="story-badge">
          {story.sample ? copy.sampleBadge : story.category}
        </span>
      </div>
      <div className="story-body">
        <div className="story-meta">
          <span>
            {story.category}
            {"official" in story && story.official ? ` · ${copy.official}` : ""}
          </span>
          <span>{formatTime(marketCode, story.updatedAt)}</span>
        </div>
        <h2 className="story-headline">{story.headline}</h2>
        <p className="story-description">{story.description}</p>
        <ul className="key-points">
          {story.keyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <section>
          <h3>{copy.whyItMatters}</h3>
          <p className="why-it-matters">{story.whyItMatters}</p>
        </section>
        <div className="story-footer">
          <p className="source-line">
            {story.sources.join(", ")} · {story.sourceCount}{" "}
            {sourceText(marketCode, story.sourceCount)}
          </p>
          <div className="story-actions">
            <button className="icon-action" type="button" onClick={onSave}>
              {isSaved ? copy.saved : copy.save}
            </button>
            <button className="icon-action" type="button" onClick={onShare}>
              {copy.share}
            </button>
            <button className="text-action" type="button" onClick={onOpen}>
              {copy.openFull}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="full-story">
            <section>
              <h3>{getMarket(marketCode).summaryLabel}</h3>
              <p>{story.description}</p>
            </section>
            <section>
              <h3>{getMarket(marketCode).whatThisMeansLabel}</h3>
              <p>
                {meaningForProfile(story, profile) ??
                  getMarket(marketCode).insufficientInfo}
              </p>
            </section>
            <section>
              <h3>{marketCode === "RS" ? "Šta sledi" : "Какво следва"}</h3>
              <p>{story.next}</p>
            </section>
            <section>
              <h3>AI Q&A</h3>
              <p>{getMarket(marketCode).insufficientInfo}</p>
            </section>
            <p className="disclaimer">{copy.disclaimer}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function InfoList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section>
      <h2>{title}</h2>
      <ul className="clean-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function StudioOutput({
  copy,
  story,
}: {
  copy: ReturnType<typeof getUiCopy>;
  story: BrieflyStory;
  marketCode: MarketCode;
}) {
  const slideLines = [
    story.headline,
    story.description,
    story.keyPoints.join(" · "),
    `${copy.whyItMatters}: ${story.whyItMatters}`,
  ];

  return (
    <div className="studio-output">
      {slideLines.map((line, index) => (
        <section className="social-slide" key={line}>
          <strong>
            {copy.studioSlide} {index + 1}
          </strong>
          <p>{line}</p>
        </section>
      ))}
      <section className="caption-box">
        <strong>{copy.studioCaption}</strong>
        <p>
          {story.description} Sources: {story.sources.join(", ")}. Briefly.
        </p>
      </section>
    </div>
  );
}
