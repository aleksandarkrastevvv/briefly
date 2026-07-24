const DATA = window.BrieflySeed;
const stateKey = "briefly-state-v1";
const firstVisitKey = "briefly-wordmark-seen-v1";

const state = loadState();
let currentView = "home";
let touchStartX = 0;

const nodes = {
  html: document.documentElement,
  splash: document.querySelector("#splash"),
  marketSelect: document.querySelector("#market-select"),
  dateLine: document.querySelector("#date-line"),
  greetingLine: document.querySelector("#greeting-line"),
  briefTitle: document.querySelector("#brief-title"),
  storyCount: document.querySelector("#story-count"),
  timeEstimate: document.querySelector("#time-estimate"),
  progressCount: document.querySelector("#progress-count"),
  progressBar: document.querySelector("#progress-bar"),
  startBrief: document.querySelector("#start-brief"),
  continueBrief: document.querySelector("#continue-brief"),
  profileToggle: document.querySelector("#profile-toggle"),
  profilePanel: document.querySelector("#profile-panel"),
  profileOptions: document.querySelector("#profile-options"),
  deleteProfile: document.querySelector("#delete-profile"),
  storyStage: document.querySelector("#story-stage"),
  briefPosition: document.querySelector("#brief-position"),
  briefDots: document.querySelector("#brief-dots"),
  previousStory: document.querySelector("#previous-story"),
  nextStory: document.querySelector("#next-story"),
  completionState: document.querySelector("#completion-state"),
  restartBrief: document.querySelector("#restart-brief"),
  sourcesList: document.querySelector("#sources-list"),
  sourceForm: document.querySelector("#source-form"),
  architectureList: document.querySelector("#architecture-list"),
  decisionList: document.querySelector("#decision-list"),
  schemaList: document.querySelector("#schema-list"),
  studioStory: document.querySelector("#studio-story"),
  studioOutput: document.querySelector("#studio-output"),
  storyTemplate: document.querySelector("#story-card-template"),
};

function loadState() {
  const fallback = {
    market: "BG",
    progress: { BG: 0, RS: 0 },
    completed: { BG: 0, RS: 0 },
    savedStoryIds: [],
    profile: [],
    customSources: [],
    analytics: [],
  };

  try {
    const stored = JSON.parse(window.localStorage.getItem(stateKey));
    return {
      ...fallback,
      ...stored,
      progress: { ...fallback.progress, ...(stored?.progress || {}) },
      completed: { ...fallback.completed, ...(stored?.completed || {}) },
      savedStoryIds: Array.isArray(stored?.savedStoryIds) ? stored.savedStoryIds : [],
      profile: Array.isArray(stored?.profile) ? stored.profile : [],
      customSources: Array.isArray(stored?.customSources) ? stored.customSources : [],
      analytics: Array.isArray(stored?.analytics) ? stored.analytics : [],
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  window.localStorage.setItem(stateKey, JSON.stringify(state));
}

function track(eventName, payload = {}) {
  state.analytics = [
    ...state.analytics.slice(-79),
    {
      eventName,
      market: state.market,
      payload,
      createdAt: new Date().toISOString(),
    },
  ];
  saveState();
}

function market() {
  return DATA.markets.find((item) => item.code === state.market) || DATA.markets[0];
}

function brief() {
  return DATA.dailyBriefs[state.market];
}

function stories() {
  return brief().stories;
}

function copy() {
  return DATA.ui[state.market];
}

function storyIndex() {
  const count = stories().length;
  return Math.min(Math.max(state.progress[state.market] || 0, 0), count - 1);
}

function setStoryIndex(index) {
  const count = stories().length;
  state.progress[state.market] = Math.min(Math.max(index, 0), count - 1);
  saveState();
  render();
}

function completedCount() {
  return Math.min(state.completed[state.market] || 0, stories().length);
}

function renderMarketOptions() {
  nodes.marketSelect.replaceChildren();
  DATA.markets.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent = item.label;
    option.selected = item.code === state.market;
    nodes.marketSelect.appendChild(option);
  });
}

function localizeStaticCopy() {
  nodes.html.lang = market().locale;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = copy()[key] || market()[key] || node.textContent;
  });
}

function greetingForHour(hour) {
  if (state.market === "RS") {
    if (hour < 12) return "Dobro jutro";
    if (hour < 18) return "Dobar dan";
    return "Dobro veče";
  }

  if (hour < 12) return "Добро утро";
  if (hour < 18) return "Добър ден";
  return "Добър вечер";
}

function renderHome() {
  const selectedMarket = market();
  const currentBrief = brief();
  const count = stories().length;
  const progress = completedCount();
  const now = new Date();
  const dateFormat = new Intl.DateTimeFormat(selectedMarket.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: selectedMarket.timezone,
  });

  nodes.dateLine.textContent = `${dateFormat.format(now)} · ${selectedMarket.label}`;
  nodes.greetingLine.textContent = greetingForHour(
    Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: selectedMarket.timezone,
      }).format(now)
    )
  );
  nodes.briefTitle.textContent = selectedMarket.dailyTitle;
  nodes.storyCount.textContent = String(count);
  nodes.timeEstimate.textContent = String(currentBrief.estimatedMinutes);
  nodes.progressCount.textContent = String(progress);
  nodes.progressBar.style.width = `${Math.round((progress / count) * 100)}%`;
  nodes.continueBrief.hidden = progress === 0;
}

function renderProfile() {
  nodes.profileOptions.replaceChildren();
  market().profileOptions.forEach((option) => {
    const id = `profile-${option.replaceAll(" ", "-")}`;
    const label = document.createElement("label");
    label.className = "profile-chip";
    label.setAttribute("for", id);

    const checkbox = document.createElement("input");
    checkbox.id = id;
    checkbox.type = "checkbox";
    checkbox.value = option;
    checkbox.checked = state.profile.includes(option);

    const text = document.createElement("span");
    text.textContent = option;

    label.append(checkbox, text);
    nodes.profileOptions.appendChild(label);
  });
}

function sourceText(sourceCount) {
  if (sourceCount === 1) return copy().oneSource;
  return copy().sourceCount;
}

function formatTime(value) {
  return new Intl.DateTimeFormat(market().locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: market().timezone,
  }).format(new Date(value));
}

function isSaved(storyId) {
  return state.savedStoryIds.includes(storyId);
}

function toggleSaved(storyId) {
  if (isSaved(storyId)) {
    state.savedStoryIds = state.savedStoryIds.filter((id) => id !== storyId);
  } else {
    state.savedStoryIds.push(storyId);
  }
  track("story_saved", { storyId, saved: isSaved(storyId) });
  render();
}

function meaningForProfile(story) {
  const matchedProfile = state.profile.find((item) => story.meansForMe[item]);
  if (matchedProfile) {
    return {
      label: matchedProfile,
      text: story.meansForMe[matchedProfile],
    };
  }
  return {
    label: market().whatThisMeansLabel,
    text: story.meansForMe.default || market().insufficientInfo,
  };
}

function renderFullStory(container, story) {
  const meaning = meaningForProfile(story);
  container.replaceChildren();
  container.hidden = false;

  const blocks = [
    [market().summaryLabel, story.description],
    [market().whatThisMeansLabel, `${meaning.label}: ${meaning.text}`],
    [state.market === "RS" ? "Šta sledi" : "Какво следва", story.next],
    ["AI Q&A", market().insufficientInfo],
  ];

  blocks.forEach(([title, text]) => {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    const paragraph = document.createElement("p");
    heading.textContent = title;
    paragraph.textContent = text;
    section.append(heading, paragraph);
    container.appendChild(section);
  });

  const disclaimer = document.createElement("p");
  disclaimer.className = "disclaimer";
  disclaimer.textContent = copy().disclaimer;
  container.appendChild(disclaimer);

  track("story_viewed", { storyId: story.id });
}

function renderStoryCard(story) {
  const fragment = nodes.storyTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".story-card");
  const image = fragment.querySelector(".story-img");
  const badge = fragment.querySelector(".story-badge");
  const category = fragment.querySelector(".story-category");
  const updated = fragment.querySelector(".story-updated");
  const headline = fragment.querySelector(".story-headline");
  const description = fragment.querySelector(".story-description");
  const keyPoints = fragment.querySelector(".key-points");
  const why = fragment.querySelector(".why-it-matters");
  const sourceLine = fragment.querySelector(".source-line");
  const saveButton = fragment.querySelector(".save-story");
  const shareButton = fragment.querySelector(".share-story");
  const openButton = fragment.querySelector(".open-story");
  const whyHeading = fragment.querySelector('[data-i18n="whyItMatters"]');
  const openLabel = fragment.querySelector('[data-i18n="openFull"]');
  const fullStory = fragment.querySelector(".full-story");

  whyHeading.textContent = copy().whyItMatters;
  openLabel.textContent = copy().openFull;
  image.src = story.image;
  image.alt = "";
  badge.textContent = story.sample ? copy().sampleBadge : story.category;
  category.textContent = story.official
    ? `${story.category} · ${copy().official}`
    : story.category;
  updated.textContent = formatTime(story.updatedAt);
  headline.textContent = story.headline;
  description.textContent = story.description;
  why.textContent = story.whyItMatters;
  sourceLine.textContent = `${story.sources.join(", ")} · ${story.sourceCount} ${sourceText(story.sourceCount)}`;

  story.keyPoints.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    keyPoints.appendChild(item);
  });

  saveButton.textContent = isSaved(story.id) ? copy().saved : copy().save;
  saveButton.addEventListener("click", () => toggleSaved(story.id));

  shareButton.textContent = copy().share;
  shareButton.addEventListener("click", async () => {
    const shareText = `${story.headline}\n\n${story.description}\n\nBriefly`;
    if (navigator.share) {
      await navigator.share({ title: story.headline, text: shareText });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      shareButton.textContent = copy().copied;
    }
    track("story_shared", { storyId: story.id });
  });

  openButton.addEventListener("click", () => {
    const shouldOpen = fullStory.hidden;
    document.querySelectorAll(".full-story").forEach((node) => {
      node.hidden = true;
      node.replaceChildren();
    });
    if (shouldOpen) renderFullStory(fullStory, story);
  });

  return card;
}

function renderBrief() {
  const items = stories();
  const index = storyIndex();
  const activeStory = items[index];
  nodes.storyStage.replaceChildren(renderStoryCard(activeStory));

  nodes.briefPosition.textContent = `${copy().storyPosition} ${index + 1} ${copy().of} ${items.length}`;
  nodes.previousStory.disabled = index === 0;
  nodes.nextStory.textContent = index === items.length - 1 ? copy().completedTitle : copy().next;
  nodes.completionState.hidden = completedCount() < items.length;

  nodes.briefDots.replaceChildren();
  items.forEach((_, dotIndex) => {
    const dot = document.createElement("button");
    dot.className = dotIndex === index ? "dot is-active" : "dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `${copy().storyPosition} ${dotIndex + 1}`);
    dot.addEventListener("click", () => setStoryIndex(dotIndex));
    nodes.briefDots.appendChild(dot);
  });
}

function renderSources() {
  const allSources = [
    ...DATA.sources,
    ...state.customSources.map((source) => ({
      ...source,
      custom: true,
      verificationStatus: "manual_entry",
    })),
  ].filter((source) => source.market === state.market);

  nodes.sourcesList.replaceChildren();
  allSources.forEach((source) => {
    const article = document.createElement("article");
    article.className = "source-row";

    const status = source.active ? copy().active : copy().inactive;
    const feed = source.feedUrl || copy().noFeed;
    const official = source.official ? ` · ${copy().official}` : "";

    const identity = document.createElement("div");
    const name = document.createElement("h2");
    const category = document.createElement("p");
    name.textContent = source.name;
    category.textContent = `${source.category}${official}`;
    identity.append(name, category);

    const meta = document.createElement("div");
    const statusNode = document.createElement("strong");
    const feedNode = document.createElement("span");
    const verificationNode = document.createElement("small");
    statusNode.textContent = status;
    feedNode.textContent = feed;
    verificationNode.textContent = source.verificationStatus || copy().requiredVerification;
    meta.append(statusNode, feedNode, verificationNode);

    article.append(identity, meta);
    nodes.sourcesList.appendChild(article);
  });
}

function renderList(node, items) {
  node.replaceChildren();
  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    node.appendChild(item);
  });
}

function renderEditorial() {
  renderList(nodes.architectureList, DATA.architecture);
  renderList(nodes.decisionList, DATA.decisions);
  renderList(nodes.schemaList, DATA.schemaTables);
}

function renderStudio() {
  nodes.studioStory.replaceChildren();
  stories().forEach((story) => {
    const option = document.createElement("option");
    option.value = story.id;
    option.textContent = story.headline;
    nodes.studioStory.appendChild(option);
  });
  renderStudioOutput();
}

function renderStudioOutput() {
  const selectedStory =
    stories().find((story) => story.id === nodes.studioStory.value) || stories()[0];
  const slideLines = [
    selectedStory.headline,
    selectedStory.description,
    selectedStory.keyPoints.join(" · "),
    `${copy().whyItMatters}: ${selectedStory.whyItMatters}`,
  ];

  nodes.studioOutput.replaceChildren();
  slideLines.forEach((line, index) => {
    const panel = document.createElement("section");
    panel.className = "social-slide";
    const label = document.createElement("strong");
    const text = document.createElement("p");
    label.textContent = `${copy().studioSlide} ${index + 1}`;
    text.textContent = line;
    panel.append(label, text);
    nodes.studioOutput.appendChild(panel);
  });

  const caption = document.createElement("section");
  caption.className = "caption-box";
  const captionLabel = document.createElement("strong");
  const captionText = document.createElement("p");
  captionLabel.textContent = copy().studioCaption;
  captionText.textContent = `${selectedStory.description} Sources: ${selectedStory.sources.join(", ")}. Briefly.`;
  caption.append(captionLabel, captionText);
  nodes.studioOutput.appendChild(caption);
}

function renderViews() {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === currentView);
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === currentView);
  });
}

function render() {
  renderMarketOptions();
  localizeStaticCopy();
  renderHome();
  renderProfile();
  renderBrief();
  renderSources();
  renderEditorial();
  renderStudio();
  renderViews();
}

function showView(viewName) {
  currentView = viewName;
  renderViews();
  if (viewName === "brief") track("brief_started");
}

function maybeShowSplash() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.localStorage.getItem(firstVisitKey)) return;
  nodes.splash.classList.add("is-visible");
  window.localStorage.setItem(firstVisitKey, "true");
  window.setTimeout(() => nodes.splash.classList.remove("is-visible"), 2400);
}

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewTarget));
});

nodes.marketSelect.addEventListener("change", (event) => {
  state.market = event.target.value;
  saveState();
  track("market_changed", { market: state.market });
  render();
});

nodes.startBrief.addEventListener("click", () => {
  state.progress[state.market] = 0;
  state.completed[state.market] = 0;
  saveState();
  showView("brief");
});

nodes.continueBrief.addEventListener("click", () => showView("brief"));

nodes.previousStory.addEventListener("click", () => setStoryIndex(storyIndex() - 1));

nodes.nextStory.addEventListener("click", () => {
  const lastIndex = stories().length - 1;
  const index = storyIndex();
  state.completed[state.market] = Math.max(completedCount(), index + 1);
  if (index === lastIndex) {
    state.progress[state.market] = stories().length;
    state.completed[state.market] = stories().length;
    track("brief_completed");
    saveState();
    render();
    return;
  }
  setStoryIndex(index + 1);
});

nodes.restartBrief.addEventListener("click", () => {
  state.progress[state.market] = 0;
  state.completed[state.market] = 0;
  saveState();
  render();
});

nodes.profileToggle.addEventListener("click", () => {
  nodes.profilePanel.hidden = !nodes.profilePanel.hidden;
  if (!nodes.profilePanel.hidden) track("personalisation_started");
});

nodes.profilePanel.addEventListener("submit", (event) => {
  event.preventDefault();
  state.profile = Array.from(nodes.profileOptions.querySelectorAll("input:checked")).map(
    (input) => input.value
  );
  nodes.profilePanel.hidden = true;
  track("personalisation_completed", { count: state.profile.length });
  render();
});

nodes.deleteProfile.addEventListener("click", () => {
  state.profile = [];
  saveState();
  render();
});

nodes.sourceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(nodes.sourceForm);
  state.customSources.push({
    market: state.market,
    name: String(form.get("name")).trim(),
    feedUrl: String(form.get("feedUrl")).trim() || null,
    category: String(form.get("category")).trim() || "manual",
    websiteUrl: null,
    type: "rss",
    language: market().language,
    active: false,
  });
  nodes.sourceForm.reset();
  saveState();
  renderSources();
});

nodes.studioStory.addEventListener("change", () => {
  renderStudioOutput();
  track("social_asset_generated", { storyId: nodes.studioStory.value, format: "draft" });
});

nodes.storyStage.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
});

nodes.storyStage.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) < 50) return;
  if (delta < 0) nodes.nextStory.click();
  if (delta > 0) nodes.previousStory.click();
});

maybeShowSplash();
render();
