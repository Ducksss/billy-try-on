import { blobToJpegDataUrl, DEFAULT_SERVER, getLooks, getMe, getServerUrl, hostOf } from "./shared.js";

const $ = (id) => document.getElementById(id);
const VERDICT = { yes: "Would buy", maybe: "Maybe", no: "Wouldn't buy" };

const state = {
  me: null,
  looks: [],
  view: "try",
  run: null, // { id, garment, status: "running" | "done" | "error", image?, error?, savedId?, verdict? }
  selected: [],
  feedLoaded: false,
};

let tick = 0;

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of children) if (child != null) node.append(child);
  return node;
}

function setView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll("[role=tab]")) tab.setAttribute("aria-selected", String(tab.dataset.view === view));
  for (const section of document.querySelectorAll(".view")) section.hidden = section.id !== `view-${view}`;
  if (view === "feed" && !state.feedLoaded) loadFeed();
  if (view === "settings") getServerUrl().then((url) => ($("server").value = url));
}

function renderTry() {
  const { me, run } = state;
  $("onboard").hidden = !!me;
  $("studio").hidden = !me;
  if (!me) return;
  $("me-thumb").src = me;

  const running = run?.status === "running";
  const done = run?.status === "done";
  $("stage-img").src = done ? run.image : me;
  $("stage-before").src = me;
  $("stage-before").hidden = true;
  $("scan").hidden = !running;
  $("hold").hidden = !done;
  $("status").hidden = !running;
  $("error").hidden = run?.status !== "error";
  $("error").textContent = run?.error ?? "";
  $("tip").hidden = running || done;

  $("result").hidden = !done;
  if (done) {
    const g = run.garment;
    $("result-thumb").src = g.image || g.url || "";
    $("result-title").textContent = g.title || "Garment";
    $("result-sub").textContent = g.price ? `S$${g.price} · ${hostOf(g.pageUrl)}` : hostOf(g.pageUrl);
    const link = g.listingUrl || g.pageUrl;
    $("open-item").hidden = !link;
    if (link) $("open-item").href = link;
    $("save").textContent = run.savedId ? "Saved" : "Save look";
    $("save").disabled = !!run.savedId;
    for (const b of document.querySelectorAll("[data-verdict]")) b.setAttribute("aria-pressed", String(run.verdict === b.dataset.verdict));
  }
}

function renderStatus() {
  if (state.run?.status !== "running") return;
  const s = Math.round((Date.now() - state.run.startedAt) / 1000);
  $("status-title").textContent = `Fitting ${state.run.garment.title ? `the ${state.run.garment.title}` : "it"} on you`;
  $("status-sub").textContent = `${s}s · ${s < 30 ? "usually about 25s" : "almost there"}`;
}

async function runTryOn(garment) {
  if (!state.me) {
    setView("try");
    return;
  }
  const id = crypto.randomUUID();
  state.run = { id, garment, status: "running", startedAt: Date.now() };
  setView("try");
  renderTry();
  renderStatus();
  clearInterval(tick);
  tick = setInterval(renderStatus, 500);
  const res = await chrome.runtime.sendMessage({ type: "billy:tryon", garment }).catch((e) => ({ error: e.message }));
  if (state.run?.id !== id) return;
  clearInterval(tick);
  if (!res || res.error) {
    state.run = { ...state.run, status: "error", error: res?.error === "no-photo" ? "Add your photo first." : res?.error || "Try-on failed." };
  } else {
    state.run = { ...state.run, status: "done", image: res.image, garment: { ...garment, image: garment.image || res.garmentImage } };
  }
  renderTry();
}

function renderLooks() {
  const { looks, selected } = state;
  $("looks-count").textContent = looks.length ? String(looks.length) : "";
  $("looks-empty").hidden = looks.length > 0;
  $("compare").hidden = looks.length < 2;
  $("compare").disabled = selected.length !== 2;
  $("compare").textContent = selected.length === 2 ? "Compare 2" : `Pick ${2 - selected.length} to compare`;
  const counts = { yes: 0, maybe: 0, no: 0 };
  for (const l of looks) if (l.verdict) counts[l.verdict]++;
  $("looks-summary").textContent = looks.length
    ? `${looks.length} saved · ${counts.yes} would buy · ${counts.maybe} maybe`
    : "";

  $("looks").replaceChildren(
    ...looks.map((look) => {
      const pick = el("button", { className: "pick", ariaLabel: `Select ${look.garment.title} to compare` }, el("img", { src: look.image, alt: "" }));
      pick.setAttribute("aria-pressed", String(selected.includes(look.id)));
      pick.addEventListener("click", () => {
        state.selected = selected.includes(look.id) ? selected.filter((x) => x !== look.id) : [...selected.slice(-1), look.id];
        renderLooks();
      });
      const del = el("button", { className: "icon", ariaLabel: `Delete ${look.garment.title}`, title: "Delete" });
      del.innerHTML = TRASH;
      del.addEventListener("click", async () => {
        state.selected = state.selected.filter((x) => x !== look.id);
        await chrome.storage.local.set({ looks: state.looks.filter((l) => l.id !== look.id) });
      });
      const sub = [look.garment.price ? `S$${look.garment.price}` : hostOf(look.garment.sourceUrl), look.verdict ? VERDICT[look.verdict] : null]
        .filter(Boolean)
        .join(" · ");
      return el("li", {}, pick, el("div", { className: "card-meta" }, el("div", {}, el("p", { textContent: look.garment.title }), el("p", { className: "muted", textContent: sub })), del));
    }),
  );
}

function openCompare() {
  const pair = state.selected.map((id) => state.looks.find((l) => l.id === id)).filter(Boolean);
  if (pair.length !== 2) return;
  $("compare-body").replaceChildren(
    ...pair.map((look) => {
      const col = el("div", {}, el("img", { src: look.image, alt: `Look with ${look.garment.title}` }), el("p", { textContent: look.garment.title }));
      if (look.verdict) col.append(el("p", { className: "muted", textContent: VERDICT[look.verdict] }));
      if (look.garment.sourceUrl) col.append(el("a", { className: "btn small", href: look.garment.sourceUrl, target: "_blank", rel: "noreferrer", textContent: "View item" }));
      return col;
    }),
  );
  $("compare-sheet").hidden = false;
}

async function loadFeed() {
  const server = await getServerUrl();
  $("feed-error").hidden = true;
  try {
    const res = await fetch(`${server}/api/catalogue`);
    if (!res.ok) throw new Error(String(res.status));
    const { items } = await res.json();
    state.feedLoaded = true;
    $("feed").replaceChildren(
      ...items.map((item) => {
        const tryBtn = el("button", { className: "btn small primary", textContent: "Try on" });
        tryBtn.addEventListener("click", () =>
          runTryOn({ url: item.image, title: item.title, listingId: item.id, listingUrl: item.listingUrl, pageUrl: item.listingUrl, price: item.price, category: item.category }),
        );
        const kind = item.kind === "pre-loved" ? "Pre-loved" : "Surplus";
        return el(
          "li",
          {},
          el("a", { className: "thumb", href: item.listingUrl, target: "_blank", rel: "noreferrer" }, el("img", { src: item.image, alt: item.title })),
          el("div", { className: "card-meta" }, el("div", {}, el("p", { textContent: item.title }), el("p", { className: "muted", textContent: `S$${item.price} · ${kind}` }))),
          el("div", { className: "row" }, tryBtn),
        );
      }),
    );
  } catch {
    $("feed-error").textContent = `Couldn't load the feed from ${server}. Is Billy's server running?`;
    $("feed-error").hidden = false;
  }
}

async function setPhoto(blob) {
  const me = await blobToJpegDataUrl(blob, 1024, 0.9);
  await chrome.storage.local.set({ me });
}

async function activeTabInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  // "Rust corduroy shirt | Some Shop" -> "Rust corduroy shirt"
  return { pageUrl: tab?.url, title: tab?.title?.split(/\s+[|\u2013\u2014-]\s+/)[0] };
}

// Drops from the page arrive as a URL list and/or HTML; files arrive from the desktop.
async function garmentFromDrop(dt) {
  const file = [...dt.files].find((f) => f.type.startsWith("image/"));
  const page = await activeTabInfo();
  if (file) return { image: await blobToJpegDataUrl(file), title: file.name.replace(/\.[a-z]+$/i, ""), pageUrl: page.pageUrl };
  const html = dt.getData("text/html");
  const fromHtml = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&");
  const alt = html.match(/<img[^>]+alt=["']([^"']*)["']/i)?.[1];
  const url = fromHtml || dt.getData("text/uri-list").split("\n").find((l) => l && !l.startsWith("#"));
  if (!url) return null;
  return { url: new URL(url, page.pageUrl || undefined).href, title: alt || page.title, pageUrl: page.pageUrl };
}

const TRASH =
  '<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>';

function wire() {
  for (const tab of document.querySelectorAll("[role=tab]")) tab.addEventListener("click", () => setView(tab.dataset.view));

  document.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "upload-photo") $("photo-input").click();
    if (action === "remove-photo") {
      state.run = null;
      await chrome.storage.local.remove("me");
    }
    if (action === "clear-looks" && confirm("Delete all saved looks?")) await chrome.storage.local.set({ looks: [] });
  });

  $("photo-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      await setPhoto(file);
      setView("try");
    }
  });

  for (const button of document.querySelectorAll("[data-model]")) {
    button.addEventListener("click", async () => {
      const server = await getServerUrl();
      try {
        const res = await fetch(`${server}/models/${button.dataset.model}.jpg`);
        if (!res.ok) throw new Error();
        await setPhoto(await res.blob());
      } catch {
        alert(`Couldn't load the example model from ${server}. Upload your own photo instead.`);
      }
    });
  }

  const stage = $("stage");
  stage.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    stage.classList.add("over");
    $("drop-hint").hidden = false;
  });
  stage.addEventListener("dragleave", () => {
    stage.classList.remove("over");
    $("drop-hint").hidden = true;
  });
  stage.addEventListener("drop", async (e) => {
    e.preventDefault();
    stage.classList.remove("over");
    $("drop-hint").hidden = true;
    const garment = await garmentFromDrop(e.dataTransfer);
    if (garment) runTryOn(garment);
    else {
      state.run = { status: "error", error: "That wasn't an image. Drag a product photo instead.", garment: {} };
      renderTry();
    }
  });

  document.addEventListener("paste", async (e) => {
    if (e.target.closest?.("input")) return;
    const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
    if (file && state.me) runTryOn({ image: await blobToJpegDataUrl(file), title: "Pasted image", ...(await activeTabInfo()) });
  });

  const hold = $("hold");
  const showBefore = (on) => ($("stage-before").hidden = !on);
  hold.addEventListener("pointerdown", () => showBefore(true));
  hold.addEventListener("pointerup", () => showBefore(false));
  hold.addEventListener("pointerleave", () => showBefore(false));
  hold.addEventListener("keydown", (e) => e.key === " " && showBefore(true));
  hold.addEventListener("keyup", (e) => e.key === " " && showBefore(false));

  $("cancel").addEventListener("click", () => {
    clearInterval(tick);
    state.run = null;
    renderTry();
  });

  $("save").addEventListener("click", async () => {
    const run = state.run;
    if (run?.status !== "done" || run.savedId) return;
    $("save").disabled = true;
    const res = await chrome.runtime.sendMessage({ type: "billy:save-look", image: run.image, garment: run.garment, verdict: run.verdict });
    if (res?.ok) {
      const looks = await getLooks();
      state.run = { ...run, savedId: looks[0]?.id ?? "saved" };
    }
    renderTry();
  });

  for (const b of document.querySelectorAll("[data-verdict]")) {
    b.addEventListener("click", async () => {
      if (!state.run) return;
      state.run.verdict = b.dataset.verdict;
      if (state.run.savedId) {
        const looks = (await getLooks()).map((l) => (l.id === state.run.savedId ? { ...l, verdict: b.dataset.verdict } : l));
        await chrome.storage.local.set({ looks });
      }
      renderTry();
    });
  }

  $("compare").addEventListener("click", openCompare);
  $("close-compare").addEventListener("click", () => ($("compare-sheet").hidden = true));

  $("server-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = $("server").value.trim().replace(/\/+$/, "") || DEFAULT_SERVER;
    await chrome.storage.local.set({ serverUrl: value });
    state.feedLoaded = false;
    setModelImages();
    setView("try");
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.me) {
      state.me = changes.me.newValue ?? null;
      renderTry();
    }
    if (area === "local" && changes.looks) {
      state.looks = changes.looks.newValue ?? [];
      state.selected = state.selected.filter((id) => state.looks.some((l) => l.id === id));
      renderLooks();
    }
    if (area === "local" && changes.serverUrl) state.feedLoaded = false;
    if (area === "session" && changes.pending?.newValue) takePending(changes.pending.newValue);
  });
}

// Garments sent from the context menu on pages without the content script.
async function takePending(pending) {
  if (!pending || Date.now() - pending.at > 60_000) return;
  await chrome.storage.session.remove("pending");
  runTryOn(pending);
}

async function setModelImages() {
  const server = await getServerUrl();
  for (const img of document.querySelectorAll("[data-model-img]")) img.src = `${server}/models/${img.dataset.modelImg}.jpg`;
}

async function init() {
  wire();
  [state.me, state.looks] = await Promise.all([getMe(), getLooks()]);
  setModelImages();
  renderTry();
  renderLooks();
  const { pending } = await chrome.storage.session.get("pending");
  takePending(pending);
}

init();
