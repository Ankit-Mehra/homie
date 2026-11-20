const config = window.HOMIE_CONFIG ?? {};
const app = document.querySelector("#app");
const sessionKey = "homie-web-session";

const state = {
  screen: "home",
  items: [],
  selectedItemId: null,
  profile: null,
  loading: true,
  itemsLoading: false,
  error: "",
  notice: "",
  authMode: "signin",
  authLoading: false,
  authError: "",
  addError: "",
  addLoading: false,
  confirmLoading: false,
  researchLoading: false,
  job: null,
};

const apiBase = String(config.apiUrl ?? "").replace(/\/$/, "");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey) ?? "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
  else localStorage.removeItem(sessionKey);
}

function hasSupabase() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function apiError(status, payload) {
  if (status === 401) {
    return new Error("Your session could not be verified. Sign in again.");
  }
  if (status === 403) {
    return new Error("Create your household before continuing.");
  }
  if (status === 422) {
    return new Error("Check the supplied fields and try again.");
  }
  return new Error(
    payload?.error?.message ??
      "Could not save or load your household. Check the local API.",
  );
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (config.devAuth) {
    headers.set("Authorization", "Bearer local-development-only");
  } else {
    const session = getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("json") ? await response.json() : null;
  if (!response.ok) throw apiError(response.status, payload);
  return payload;
}

async function supabaseRequest(path, body) {
  const response = await fetch(
    `${String(config.supabaseUrl).replace(/\/$/, "")}${path}`,
    {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description ?? payload.msg ?? payload.message ?? "Authentication failed.");
  }
  return payload;
}

async function signIn(email, password, signup) {
  const payload = signup
    ? await supabaseRequest("/auth/v1/signup", { email, password })
    : await supabaseRequest("/auth/v1/token?grant_type=password", {
        email,
        password,
      });
  if (!payload.access_token) {
    state.notice = "Check your email to confirm the account, then sign in here.";
    state.authMode = "signin";
    return false;
  }
  saveSession(payload);
  return true;
}

async function loadProfile() {
  state.profile = await request("/v1/me");
  if (!state.profile.household_id) return;
  await loadItems();
}

async function loadItems() {
  state.itemsLoading = true;
  render();
  try {
    const page = await request("/v1/items?offset=0&limit=100");
    state.items = page.items ?? [];
    state.error = "";
  } catch (error) {
    state.error = error.message;
  } finally {
    state.itemsLoading = false;
    render();
  }
}

function selectedItem() {
  return state.items.find((item) => item.id === state.selectedItemId) ?? null;
}

function formatCategory(category) {
  return String(category ?? "item").toLowerCase();
}

function formatToday() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function icon(name) {
  const icons = {
    home: "⌂",
    inventory: "▦",
    help: "?",
    plus: "+",
    arrow: "↗",
    back: "←",
    check: "✓",
    spark: "✳",
  };
  return icons[name] ?? "•";
}

function render() {
  if (state.loading) {
    app.innerHTML = `
      <div class="boot-screen">
        <span class="brand-mark" aria-hidden="true">●</span>
        <span>Opening your home…</span>
      </div>`;
    return;
  }

  if (!config.devAuth && !hasSupabase()) {
    app.innerHTML = renderSetup();
    return;
  }

  if (!config.devAuth && !getSession()) {
    app.innerHTML = renderAuth();
    return;
  }

  if (!state.profile?.household_id) {
    app.innerHTML = renderOnboarding();
    return;
  }

  app.innerHTML = renderShell();
}

function renderSetup() {
  return `
    <main class="auth-layout">
      <section class="auth-card">
        <div class="eyebrow">Homie / local web</div>
        <h1>One small setup step.</h1>
        <p>Configure the browser client in <code>web/config.js</code>, or run the API with <code>DEV_AUTH=true</code> for the offline local prototype.</p>
        <div class="setup-note"><span>${icon("spark")}</span><strong>SQLite is ready.</strong><span>The local API is the source of truth for this browser session.</span></div>
      </section>
    </main>`;
}

function renderAuth() {
  const signup = state.authMode === "signup";
  let authButtonLabel = signup ? "Create account" : "Sign in";
  if (state.authLoading) authButtonLabel = "Please wait…";
  return `
    <main class="auth-layout">
      <section class="auth-card auth-card-wide">
        <div class="auth-brand"><span class="brand-mark">●</span><span>homie</span></div>
        <div class="eyebrow">A softer way to keep up</div>
        <h1>${signup ? "A home for your things." : "Welcome home."}</h1>
        <p>${signup ? "Create an account to start looking after what you own." : "Sign in to your household and pick up where you left off."}</p>
        <form data-form="auth" class="stack-form">
          <label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" required minlength="${signup ? "8" : "1"}" placeholder="At least 8 characters" /></label>
          ${state.authError ? `<p class="form-error" role="alert">${escapeHtml(state.authError)}</p>` : ""}
          ${state.notice ? `<p class="form-notice" role="status">${escapeHtml(state.notice)}</p>` : ""}
          <button class="button button-primary" type="submit" ${state.authLoading ? "disabled" : ""}>${authButtonLabel} ${icon("arrow")}</button>
        </form>
        <button class="text-button" data-action="toggle-auth">${signup ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      </section>
      <aside class="auth-aside"><div class="orbit orbit-large"><span>01</span><small>look after<br />what matters</small></div></aside>
    </main>`;
}

function renderOnboarding() {
  return `
    <main class="auth-layout">
      <section class="auth-card">
        <div class="eyebrow">First, make it yours</div>
        <h1>Make yourself at home.</h1>
        <p>Create one shared household for your things, their stories, and what they need next.</p>
        ${state.error ? `<p class="form-error" role="alert">${escapeHtml(state.error)}</p>` : ""}
        <button class="button button-primary" data-action="create-household" ${state.loading ? "disabled" : ""}>Create my household ${icon("arrow")}</button>
        ${!config.devAuth ? `<button class="text-button" data-action="sign-out">Sign out</button>` : ""}
      </section>
    </main>`;
}

function renderShell() {
  const item = selectedItem();
  const screenTitle = getScreenTitle(item);
  const screenContent = renderScreenContent(item);
  return `
    <div class="app-shell">
      ${renderSidebar()}
      <main class="main-column">
        <header class="topbar">
          <div class="mobile-brand"><span class="brand-mark">●</span> homie</div>
          <div class="breadcrumbs"><span>YOUR HOUSEHOLD</span><i>/</i><strong>${escapeHtml(screenTitle)}</strong></div>
          <div class="topbar-actions"><span class="connection-dot"></span><span>local SQLite</span><button class="avatar" aria-label="Account">A</button></div>
        </header>
        ${state.error ? `<div class="global-error" role="alert">${escapeHtml(state.error)} <button class="text-button" data-action="retry">Try again</button></div>` : ""}
        ${state.notice ? `<div class="global-notice" role="status">${escapeHtml(state.notice)} <button class="text-button" data-action="dismiss-notice">Dismiss</button></div>` : ""}
        <div class="content-wrap">
          ${screenContent}
        </div>
      </main>
    </div>`;
}

function getScreenTitle(item) {
  const titles = {
    home: "Good things, looked after.",
    inventory: "Your things",
    add: "Add an item",
    help: "Ask for help",
  };
  if (state.screen === "detail") return item?.name ?? "Item details";
  return titles[state.screen] ?? titles.home;
}

function renderScreenContent(item) {
  if (state.screen === "add") return renderAdd();
  if (state.screen === "detail" && item) return renderDetail(item);
  if (state.screen === "help") return renderHelp();
  if (state.screen === "inventory") return renderInventoryPage();
  return renderHome();
}

function renderInventoryPage() {
  let inventoryContent;
  if (state.itemsLoading) {
    inventoryContent = `<div class="empty-state"><div class="loader"></div><p>Gathering your things…</p></div>`;
  } else if (state.items.length) {
    inventoryContent = `<div class="inventory-grid inventory-grid-wide">${state.items.map(renderItemCard).join("")}</div>`;
  } else {
    inventoryContent = `<div class="empty-state"><div class="empty-mark">✳</div><h3>Every home has a first.</h3><p>Add your coffee maker, your vacuum, or the appliance you always mean to look after.</p><button class="button button-dark" data-screen="add">Add your first item ${icon("arrow")}</button></div>`;
  }
  return `
    <section class="subpage reveal reveal-1">
      <div class="page-intro"><div><div class="eyebrow">THE COLLECTION</div><h1>Your things.</h1><p>Everything worth looking after, in one place.</p></div><button class="button button-outline" data-screen="add">${icon("plus")} Add an item</button></div>
      ${inventoryContent}
    </section>`;
}

function renderSidebar() {
  const nav = [
    ["home", "Home", "home"],
    ["inventory", "Inventory", "inventory"],
    ["help", "Ask for help", "help"],
  ];
  return `
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">●</span><span>homie</span></div>
      <div class="sidebar-caption">THE HOUSEHOLD DESK</div>
      <nav aria-label="Primary navigation">
        ${nav.map(renderNavItem).join("")}
      </nav>
      <div class="sidebar-bottom">
        <div class="mini-orbit"><span>${String(state.items.length).padStart(2, "0")}</span><small>things<br />at home</small></div>
        <p>Small attention adds up.</p>
        ${!config.devAuth ? `<button class="sidebar-signout" data-action="sign-out">Sign out</button>` : `<span class="local-badge">LOCAL MODE</span>`}
      </div>
    </aside>`;
}

function renderNavItem([screen, label, iconName]) {
  const activeClass = state.screen === screen ? "active" : "";
  const countMarkup = screen === "inventory" && state.items.length
    ? `<span class="nav-count">${state.items.length}</span>`
    : "";
  return `<button class="nav-item ${activeClass}" data-screen="${screen}"><span class="nav-icon">${icon(iconName)}</span><span>${label}</span>${countMarkup}</button>`;
}

function renderHome() {
  const confirmed = state.items.filter((item) => item.model_confirmed).length;
  const pending = state.items.length - confirmed;
  return `
    <section class="page-intro reveal reveal-1">
      <div><div class="eyebrow">${formatToday()}</div><h1>A little care.<br /><em>A happier home.</em></h1><p>Your things, their stories, and what they need next.</p></div>
      <button class="button button-outline" data-screen="add">${icon("plus")} Add an item</button>
    </section>
    <section class="hero-grid reveal reveal-2">
      <div class="attention-card">
        <div class="card-kicker"><span class="kicker-dot"></span> ATTENTION, WHEN YOU NEED IT</div>
        <h2>Something not<br />quite right?</h2>
        <p>Start with the thing that needs a little attention. We’ll take it one careful question at a time.</p>
        <button class="button button-dark" data-screen="help">Ask for help ${icon("arrow")}</button>
        <div class="scribble" aria-hidden="true">✳</div>
      </div>
      <div class="care-card">
        <div class="card-kicker">UPCOMING CARE</div>
        <div class="care-orbit"><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-center"><strong>0</strong><span>due soon</span></div></div>
        <h3>Room to breathe.</h3><p>No active reminders. You’ll review and approve any proposed schedule first.</p>
      </div>
    </section>
    <section class="stat-row reveal reveal-3">
      <div class="stat"><span class="stat-label">IN YOUR HOME</span><strong>${String(state.items.length).padStart(2, "0")}</strong><span>saved ${state.items.length === 1 ? "thing" : "things"}</span></div>
      <div class="stat"><span class="stat-label">MODEL CHECK</span><strong>${String(confirmed).padStart(2, "0")}</strong><span>${pending ? `${pending} waiting for you` : "all models confirmed"}</span></div>
      <div class="stat stat-accent"><span class="stat-label">NEXT SMALL STEP</span><strong>${pending ? "Confirm" : "Add"}</strong><span>${pending ? "a model below" : "your first item"}</span></div>
    </section>
    ${renderInventorySection("Your things", "Everything worth looking after, in one place.")}`;
}

function renderInventorySection(title, subtitle) {
  return `
    <section class="inventory-section reveal reveal-4">
      <div class="section-heading"><div><div class="eyebrow">THE COLLECTION</div><h2>${title}</h2><p>${subtitle}</p></div><button class="text-button" data-screen="inventory">View all ${icon("arrow")}</button></div>
      ${renderInventoryCards()}
    </section>`;
}

function renderInventoryCards() {
  if (state.itemsLoading) return `<div class="empty-state"><div class="loader"></div><p>Gathering your things…</p></div>`;
  if (!state.items.length) {
    return `<div class="empty-state"><div class="empty-mark">✳</div><h3>Every home has a first.</h3><p>Add your coffee maker, your vacuum, or the appliance you always mean to look after.</p><button class="button button-dark" data-screen="add">Add your first item ${icon("arrow")}</button></div>`;
  }
  return `<div class="inventory-grid">${state.items.slice(0, 4).map(renderItemCard).join("")}</div>`;
}

function renderItemCard(item) {
  return `<button class="item-card" data-item="${escapeHtml(item.id)}"><span class="item-topline"><span>${escapeHtml(item.room || "YOUR HOME")}</span><span class="item-arrow">${icon("arrow")}</span></span><span class="item-illustration ${formatCategory(item.category)}"><span>${item.model_confirmed ? "✓" : "?"}</span></span><span class="item-name">${escapeHtml(item.name)}</span><span class="item-meta">${escapeHtml(item.brand)} · ${escapeHtml(item.model)}</span><span class="item-status ${item.model_confirmed ? "confirmed" : "pending"}">${item.model_confirmed ? "Model confirmed" : "Needs your check"}</span></button>`;
}

function renderAdd() {
  return `
    <section class="subpage reveal reveal-1"><button class="back-button" data-screen="home">${icon("back")} Back home</button><div class="subpage-heading"><div class="eyebrow">ADD TO THE HOUSEHOLD</div><h1>Make yourself at home.</h1><p>Start with one thing you own. You’ll confirm its model before we look for documentation.</p></div>
      <form data-form="add-item" class="add-layout"><div class="form-panel"><div class="field-grid"><label>Item name<input name="name" required placeholder="KitchenAid mixer" /></label><label>Brand<input name="brand" required placeholder="KitchenAid" /></label><label>Model number<input name="model" required placeholder="KSM150" /></label><label>Category<input name="category" required value="Appliance" /></label><label class="field-wide">Room <span class="optional">optional</span><input name="room" placeholder="Kitchen" /></label></div>${state.addError ? `<p class="form-error" role="alert">${escapeHtml(state.addError)}</p>` : ""}<button class="button button-dark" type="submit" ${state.addLoading ? "disabled" : ""}>${state.addLoading ? "Saving…" : "Add to your home"} ${icon("arrow")}</button></div><aside class="form-aside"><div class="label-mark">✳</div><h3>Good records make good care.</h3><p>Add the details you know now. Serial number, purchase date, warranty, and receipts can come later.</p></aside></form>
    </section>`;
}

function renderDetail(item) {
  const confirmed = item.model_confirmed;
  const modelDescription = confirmed
    ? "Confirmed by you. This is the reference point for model-specific guidance."
    : "Check the model number against the label on your item before relying on exact guidance.";
  let modelAction;
  if (confirmed) {
    modelAction = `<div class="confirmed-line">${icon("check")} Model confirmation saved to your household.</div>`;
  } else {
    const confirmLabel = state.confirmLoading ? "Confirming…" : "Yes, this is my model";
    const confirmDisabled = state.confirmLoading ? "disabled" : "";
    modelAction = `<button class="button button-dark" data-action="confirm" ${confirmDisabled}>${confirmLabel} ${icon("arrow")}</button>`;
  }
  const researchLabel = state.researchLoading ? "Requesting…" : "Find documentation";
  let jobStatus = "";
  if (state.job) {
    const jobTitle = state.job.status === "queued" ? "Looking for the right source…" : "Research update";
    jobStatus = `<div class="job-status"><span class="job-pulse"></span><div><strong>${escapeHtml(jobTitle)}</strong><p>${escapeHtml(state.job.detail)}</p></div></div>`;
  }
  return `
    <section class="subpage reveal reveal-1"><button class="back-button" data-screen="home">${icon("back")} Back home</button><div class="detail-header"><div><div class="eyebrow">${escapeHtml((item.room || "YOUR HOME").toUpperCase())} / ${escapeHtml(item.category.toUpperCase())}</div><h1>${escapeHtml(item.name)}</h1><p class="lead">${escapeHtml(item.brand)} · ${escapeHtml(item.model)}</p></div><span class="detail-badge ${confirmed ? "confirmed" : "pending"}">${confirmed ? `${icon("check")} confirmed` : "needs a check"}</span></div>
      <div class="detail-grid"><div class="detail-main"><article class="detail-card model-card"><div class="detail-card-top"><span class="item-illustration ${formatCategory(item.category)} large"><span>${confirmed ? "✓" : "?"}</span></span><div><div class="eyebrow">THE MODEL LABEL</div><h2>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</h2><p>${modelDescription}</p></div></div>${modelAction}</article><article class="detail-card"><div class="detail-card-top"><div class="section-icon">${icon("spark")}</div><div><div class="eyebrow">DOCUMENTATION</div><h2>Official guidance first.</h2><p>We’ll look for documentation that matches the confirmed model. The local foundation records the request honestly until discovery is connected.</p></div></div><button class="button button-outline" data-action="research" ${!confirmed || state.researchLoading ? "disabled" : ""}>${researchLabel} ${icon("arrow")}</button>${jobStatus}</article></div><aside class="detail-side"><div class="side-note"><div class="eyebrow">CARE & SERVICE HISTORY</div><h3>Nothing recorded yet.</h3><p>When maintenance is mentioned, Homie will propose the work and date. It only saves after you confirm.</p><span class="side-number">01</span></div><div class="side-note muted-note"><div class="eyebrow">OWNERSHIP</div><p>Serial number, purchase date, warranty, and receipt fields are ready for the next pass.</p></div></aside></div>
    </section>`;
}

function renderHelp() {
  return `
    <section class="subpage help-page reveal reveal-1"><button class="back-button" data-screen="home">${icon("back")} Back home</button><div class="help-hero"><div class="eyebrow">A CAREFUL START</div><h1>Tell us what’s<br /><em>not quite right.</em></h1><p>Conversational troubleshooting is coming next. For now, start with the item so we can keep its model and care history together.</p><button class="button button-dark" data-screen="add">Add an item first ${icon("arrow")}</button></div><div class="help-steps"><div><span>01</span><h3>Choose the thing</h3><p>Start with an item already in your home, or add a new one.</p></div><div><span>02</span><h3>Confirm the model</h3><p>Exact details keep model-specific advice grounded.</p></div><div><span>03</span><h3>Take the next step</h3><p>We’ll ask focused questions instead of flooding you with guesses.</p></div></div></section>`;
}

async function initialize() {
  try {
    if (!config.devAuth && !getSession()) {
      state.loading = false;
      render();
      return;
    }
    await loadProfile();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function createHousehold() {
  state.loading = true;
  state.error = "";
  render();
  try {
    await request("/v1/me/household", { method: "POST" });
    await loadProfile();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function submitAuth(form) {
  const data = new FormData(form);
  state.authLoading = true;
  state.authError = "";
  state.notice = "";
  render();
  try {
    const email = formValue(data, "email").trim();
    const password = formValue(data, "password");
    const authenticated = await signIn(
      email,
      password,
      state.authMode === "signup",
    );
    if (authenticated) await loadProfile();
  } catch (error) {
    state.authError = error.message;
  } finally {
    state.authLoading = false;
    state.loading = false;
    render();
  }
}

function formValue(data, name) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

async function addItem(form) {
  const data = new FormData(form);
  const body = Object.fromEntries(data.entries());
  state.addLoading = true;
  state.addError = "";
  render();
  try {
    const item = await request("/v1/items", { method: "POST", body: JSON.stringify(body) });
    await loadItems();
    state.selectedItemId = item.id;
    state.screen = "detail";
    state.notice = "Item added — check the model before requesting documentation.";
  } catch (error) {
    state.addError = error.message;
  } finally {
    state.addLoading = false;
    render();
  }
}

async function confirmItem() {
  const item = selectedItem();
  if (!item) return;
  state.confirmLoading = true;
  render();
  try {
    const confirmed = await request(`/v1/items/${encodeURIComponent(item.id)}/confirm-model`, { method: "POST" });
    Object.assign(item, confirmed);
    state.notice = "Model confirmed — now documentation can be requested.";
  } catch (error) {
    state.error = error.message;
  } finally {
    state.confirmLoading = false;
    render();
  }
}

async function researchItem() {
  const item = selectedItem();
  if (!item) return;
  state.researchLoading = true;
  state.error = "";
  render();
  try {
    state.job = await request(`/v1/items/${encodeURIComponent(item.id)}/research`, { method: "POST" });
    void pollJob(state.job.id);
  } catch (error) {
    state.error = error.message;
  } finally {
    state.researchLoading = false;
    render();
  }
}

async function pollJob(id) {
  try {
    const job = await request(`/v1/research/${encodeURIComponent(id)}`);
    state.job = job;
    render();
    if (job.status === "queued") window.setTimeout(() => pollJob(id), 2000);
  } catch (error) {
    state.error = error.message;
    render();
  }
}

async function signOut() {
  saveSession(null);
  state.profile = null;
  state.items = [];
  state.selectedItemId = null;
  state.screen = "home";
  render();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-screen], [data-item]");
  if (!target) return;
  const { action, screen, item } = target.dataset;
  if (screen) {
    state.screen = screen;
    state.selectedItemId = null;
    state.notice = "";
    render();
    return;
  }
  if (item) {
    state.selectedItemId = item;
    state.screen = "detail";
    state.notice = "";
    state.job = null;
    render();
    return;
  }
  if (action === "toggle-auth") {
    state.authMode = state.authMode === "signup" ? "signin" : "signup";
    state.authError = "";
    state.notice = "";
    render();
  } else if (action === "create-household") {
    void createHousehold();
  } else if (action === "confirm") {
    void confirmItem();
  } else if (action === "research") {
    void researchItem();
  } else if (action === "retry") {
    void loadItems();
  } else if (action === "sign-out") {
    void signOut();
  } else if (action === "dismiss-notice") {
    state.notice = "";
    render();
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.form === "auth") void submitAuth(form);
  if (form.dataset.form === "add-item") void addItem(form);
});

await initialize();
