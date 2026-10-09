// Billy content script: a "Try on" button over product photos, a drop target while an
// image is being dragged, and a result card. All UI lives in one shadow root so page
// styles can't reach it. Work that needs network access happens in the service worker.
(() => {
  const MIN_SIZE = 160;
  const HANGER =
    '<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M244,168,148,96l19.2-14.4A12,12,0,0,0,172,72a44,44,0,0,0-87.66-5.48,12,12,0,1,0,23.82,3,20,20,0,0,1,39.09-2.92L121,86.24c-.15.1-.29.21-.43.32L12,168a20,20,0,0,0,12,36H232a20,20,0,0,0,12-36ZM36,180l92-69,92,69Z"/></svg>';

  document.querySelectorAll("billy-root").forEach((el) => el.remove());
  const host = document.createElement("billy-root");
  host.style.cssText = "all: initial; position: fixed; inset: 0 auto auto 0; z-index: 2147483646;";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host { --bg:#fafaf8; --surface:#f3f3f1; --ink:#141413; --muted:#5f5f5a; --line:#dcdcd7; --accent:#c2401f; --accent-ink:#fafaf8;
        --shadow:0 1px 2px rgb(40 30 20 / .08), 0 18px 48px -12px rgb(40 30 20 / .35); }
      @media (prefers-color-scheme: dark) { :host { --bg:#1a1a18; --surface:#252522; --ink:#ededea; --muted:#a1a19b; --line:#34342f; --accent:#ff6b47; --accent-ink:#141413;
        --shadow:0 1px 2px rgb(0 0 0 / .5), 0 18px 48px -12px rgb(0 0 0 / .7); } }
      * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
      [hidden] { display: none !important; }
      button { font: inherit; cursor: pointer; border: 0; }
      svg { width: 16px; height: 16px; flex: none; }
      .pill { position: fixed; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px 7px 10px; border-radius: 999px;
        background: var(--accent); color: var(--accent-ink); font-size: 13px; font-weight: 600; box-shadow: var(--shadow);
        transition: transform .15s cubic-bezier(.16,1,.3,1), opacity .15s; }
      .pill:hover { transform: translateY(-1px); }
      .pill:active { transform: scale(.97); }
      .zone, .card { position: fixed; right: 20px; bottom: 20px; width: 288px; background: var(--bg); color: var(--ink);
        border-radius: 20px; box-shadow: var(--shadow); overflow: hidden; }
      .zone { padding: 10px; border: 2px dashed var(--accent); transition: transform .15s; }
      .zone.over { transform: scale(1.03); }
      .zone .frame { aspect-ratio: 3/4; border-radius: 14px; overflow: hidden; background: var(--surface); position: relative; }
      .zone .frame img { width: 100%; height: 100%; object-fit: cover; opacity: .55; }
      .zone p { margin: 10px 4px 2px; font-size: 13px; font-weight: 600; text-align: center; }
      .zone .hint { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; text-align: center; font-size: 13px; color: var(--muted); }
      .card header { display: flex; align-items: center; justify-content: space-between; padding: 10px 10px 10px 14px; }
      .logo { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 15px; letter-spacing: -.01em; }
      .logo span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 999px; background: var(--accent); color: var(--accent-ink); }
      .logo span svg { width: 13px; height: 13px; }
      .icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: transparent; color: var(--muted); }
      .icon:hover { background: var(--surface); color: var(--ink); }
      .card .frame { position: relative; margin: 0 10px; aspect-ratio: 3/4; max-height: calc(100vh - 240px); border-radius: 14px; overflow: hidden; background: var(--surface); }
      .card .frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .card .frame img.preview { animation: fade .6s ease-out; }
      @keyframes fade { from { opacity: .3; } }
      .scan { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, color-mix(in oklab, var(--accent) 25%, transparent) 70%,
        color-mix(in oklab, var(--accent) 60%, transparent) 98%, transparent); animation: scan 2.2s cubic-bezier(.45,0,.55,1) infinite; }
      @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
      @media (prefers-reduced-motion: reduce) { .scan { animation: none; opacity: .35; } }
      .status { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 9px 11px; border-radius: 12px; background: color-mix(in oklab, var(--bg) 92%, transparent);
        font-size: 12.5px; line-height: 1.35; }
      .status b { display: block; font-size: 13px; }
      .status .muted { color: var(--muted); font-variant-numeric: tabular-nums; }
      .compare { position: absolute; right: 8px; top: 8px; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
        background: color-mix(in oklab, var(--bg) 90%, transparent); color: var(--ink); user-select: none; }
      .meta { display: flex; align-items: center; gap: 10px; padding: 12px 14px 0; }
      .meta img { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; border: 1px solid var(--line); background: var(--surface); }
      .meta div { min-width: 0; }
      .meta p { margin: 0; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .meta p + p { color: var(--muted); font-size: 12px; }
      .actions { display: flex; gap: 8px; padding: 12px 14px 14px; }
      .btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 12px; border-radius: 999px; font-size: 13px;
        font-weight: 600; white-space: nowrap; background: var(--surface); color: var(--ink); border: 1px solid var(--line); transition: transform .15s; }
      .btn:active { transform: scale(.98); }
      .btn.primary { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
      .btn:disabled { opacity: .5; cursor: default; }
      .error { margin: 12px 14px 0; font-size: 13px; line-height: 1.4; }
    </style>
    <button class="pill" hidden>${HANGER}Try on</button>
    <div class="zone" hidden>
      <div class="frame"><img alt="" hidden /><div class="hint" hidden>Drop here. You'll add a photo of yourself in Billy first.</div></div>
      <p>Drop on you to try it on</p>
    </div>
    <section class="card" role="dialog" aria-label="Billy try-on" hidden>
      <header>
        <div class="logo"><span>${HANGER}</span>billy</div>
        <button class="icon close" aria-label="Close">
          <svg viewBox="0 0 256 256"><path fill="currentColor" d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"/></svg>
        </button>
      </header>
      <div class="frame">
        <img class="base" alt="" />
        <img class="before" alt="" hidden />
        <div class="scan" hidden></div>
        <button class="compare" hidden>Hold to compare</button>
        <div class="status" role="status" hidden><b></b><span class="muted"></span></div>
      </div>
      <p class="error" role="alert" hidden></p>
      <div class="meta"><img alt="" /><div><p class="title"></p><p class="sub"></p></div></div>
      <div class="actions">
        <button class="btn primary save">Save look</button>
        <button class="btn open">Open Billy</button>
      </div>
    </section>`;
  document.documentElement.append(host);

  const $ = (sel) => root.querySelector(sel);
  const pill = $(".pill");
  const zone = $(".zone");
  const card = $(".card");
  const ui = {
    base: $(".card .base"),
    before: $(".card .before"),
    scan: $(".scan"),
    compare: $(".compare"),
    status: $(".status"),
    statusTitle: $(".status b"),
    statusSub: $(".status .muted"),
    error: $(".error"),
    metaImg: $(".meta img"),
    title: $(".meta .title"),
    sub: $(".meta .sub"),
    save: $(".save"),
    open: $(".open"),
  };

  let hovered = null;
  let hideTimer = 0;
  let raf = 0;
  let pointer = [0, 0];
  let dragGarment = null;
  let job = null;
  let tick = 0;

  // After the extension reloads, this copy of the script is orphaned: remove its UI.
  function alive() {
    if (chrome.runtime?.id) return true;
    teardown();
    return false;
  }

  function send(message) {
    return chrome.runtime.sendMessage(message);
  }

  function bestSrc(img) {
    let best = img.currentSrc || img.src;
    let bestScore = 0;
    const srcset = img.getAttribute("srcset") || img.closest("picture")?.querySelector("source[srcset]")?.getAttribute("srcset");
    for (const part of (srcset || "").split(/,\s+/)) {
      const [url, descriptor = ""] = part.trim().split(/\s+/);
      if (!url) continue;
      const score = descriptor.endsWith("w") ? parseFloat(descriptor) : (parseFloat(descriptor) || 1) * 1000;
      if (score > bestScore) {
        bestScore = score;
        best = new URL(url, location.href).href;
      }
    }
    return best;
  }

  function isCandidate(img) {
    if (!(img instanceof HTMLImageElement) || host.contains(img)) return false;
    const r = img.getBoundingClientRect();
    if (r.width < MIN_SIZE || r.height < MIN_SIZE) return false;
    const src = img.currentSrc || img.src;
    return !!src && !/\.svg(\?|$)/i.test(src) && (!src.startsWith("data:") || src.length > 4000);
  }

  function pageTitle() {
    const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
    return title.split(/\s+[|\u2013\u2014-]\s+/)[0];
  }

  function garmentFrom(img) {
    return { url: bestSrc(img), pageUrl: location.href, title: (img.alt || "").trim() || pageTitle() };
  }

  function placePill(img) {
    const r = img.getBoundingClientRect();
    const top = Math.max(8, r.top + 12);
    const left = Math.min(window.innerWidth - 110, Math.max(8, r.left + 12));
    pill.style.top = `${top}px`;
    pill.style.left = `${left}px`;
    pill.hidden = false;
  }

  function checkHover() {
    raf = 0;
    if (!alive() || dragGarment) return;
    const els = document.elementsFromPoint(pointer[0], pointer[1]);
    if (els[0] === host) return clearTimeout(hideTimer);
    const img = els.find(isCandidate);
    if (img) {
      clearTimeout(hideTimer);
      hovered = img;
      placePill(img);
    } else if (!pill.hidden) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        pill.hidden = true;
        hovered = null;
      }, 250);
    }
  }

  function onMove(e) {
    pointer = [e.clientX, e.clientY];
    if (!raf) raf = requestAnimationFrame(checkHover);
  }

  function onScroll() {
    pill.hidden = true;
  }

  pill.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hovered && alive()) start(garmentFrom(hovered));
  });

  async function showZone() {
    if (!alive()) return;
    const zoneImg = zone.querySelector("img");
    const hint = zone.querySelector(".hint");
    const { me } = await send({ type: "billy:me" }).catch(() => ({}));
    zoneImg.hidden = !me;
    hint.hidden = !!me;
    if (me) zoneImg.src = me;
    card.hidden = true;
    zone.hidden = false;
  }

  function onDragStart(e) {
    if (!alive()) return;
    const t = e.target;
    const img = t instanceof HTMLImageElement ? t : t?.querySelector?.("img");
    dragGarment = img && isCandidate(img) ? garmentFrom(img) : null;
    if (dragGarment) {
      pill.hidden = true;
      showZone();
    }
  }

  function onDragEnd() {
    setTimeout(() => {
      zone.hidden = true;
      zone.classList.remove("over");
      dragGarment = null;
      if (job) card.hidden = false;
    }, 60);
  }

  zone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    zone.classList.add("over");
  });
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    const fallback = e.dataTransfer.getData("text/uri-list").split("\n").find((l) => l && !l.startsWith("#"));
    const garment = dragGarment ?? (fallback ? { url: fallback, pageUrl: location.href, title: pageTitle() } : null);
    zone.hidden = true;
    dragGarment = null;
    if (garment) start(garment);
  });

  function setStatus(title, sub) {
    ui.status.hidden = !title;
    ui.statusTitle.textContent = title || "";
    ui.statusSub.textContent = sub || "";
  }

  function siteOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  async function start(garment) {
    if (!alive()) return;
    const id = Math.random().toString(36).slice(2);
    job = { id, garment, result: null, preview: false };
    clearInterval(tick);
    pill.hidden = true;
    card.hidden = false;
    ui.error.hidden = true;
    ui.before.hidden = true;
    ui.compare.hidden = true;
    ui.save.disabled = true;
    ui.save.textContent = "Save look";
    ui.metaImg.src = garment.url;
    ui.title.textContent = garment.title || "Garment";
    ui.sub.textContent = siteOf(garment.pageUrl);

    const { me } = await send({ type: "billy:me" }).catch(() => ({}));
    if (!me) {
      ui.base.removeAttribute("src");
      ui.scan.hidden = true;
      setStatus("");
      showError("Add a photo of yourself first. Open Billy, upload a full-length photo, then press Try on again.");
      return;
    }
    ui.base.src = me;
    ui.base.classList.remove("preview");
    ui.scan.hidden = false;
    const { quality } = await chrome.storage.local.get("quality").catch(() => ({}));
    const expected = quality === "medium" ? 25 : 10;
    const started = Date.now();
    const render = () => {
      const s = Math.round((Date.now() - started) / 1000);
      const title = job?.preview ? "Adding the finishing details" : "Fitting it on you";
      setStatus(title, `${s}s · ${s <= expected + 5 ? `usually about ${expected}s` : "almost there"}`);
    };
    render();
    tick = setInterval(render, 500);

    const res = await send({ type: "billy:tryon", garment, jobId: id }).catch((err) => ({ error: err.message }));
    if (job?.id !== id) return;
    clearInterval(tick);
    ui.scan.hidden = true;
    setStatus("");
    if (!res || res.error) {
      showError(res?.error === "no-photo" ? "Add a photo of yourself in Billy first." : res?.error || "Try-on failed.");
      return;
    }
    job.result = res;
    ui.before.src = me;
    ui.base.classList.remove("preview");
    ui.base.src = res.image;
    ui.compare.hidden = false;
    ui.save.disabled = false;
  }

  function showError(message) {
    ui.error.textContent = message;
    ui.error.hidden = false;
    ui.save.disabled = true;
  }

  const showBefore = (on) => job?.result && (ui.before.hidden = !on);
  ui.compare.addEventListener("pointerdown", () => showBefore(true));
  ui.compare.addEventListener("pointerup", () => showBefore(false));
  ui.compare.addEventListener("pointerleave", () => showBefore(false));
  ui.compare.addEventListener("keydown", (e) => e.key === " " && showBefore(true));
  ui.compare.addEventListener("keyup", (e) => e.key === " " && showBefore(false));

  ui.save.addEventListener("click", async () => {
    if (!job?.result || !alive()) return;
    ui.save.disabled = true;
    const res = await send({ type: "billy:save-look", image: job.result.image, garment: job.garment }).catch((e) => ({ error: e.message }));
    ui.save.textContent = res?.error ? "Couldn't save" : "Saved";
  });

  ui.open.addEventListener("click", async () => {
    if (!alive()) return;
    const res = await send({ type: "billy:open-panel" }).catch((e) => ({ error: e.message }));
    if (res?.error) ui.open.textContent = "Click Billy in the toolbar";
  });

  $(".close").addEventListener("click", () => {
    job = null;
    clearInterval(tick);
    card.hidden = true;
  });

  function onKey(e) {
    if (e.key === "Escape" && !card.hidden) {
      job = null;
      clearInterval(tick);
      card.hidden = true;
    }
  }

  function onMessage(message) {
    if (message?.type === "billy:start" && message.garment) start(message.garment);
    // A rough preview of the look while it renders.
    if (message?.type === "billy:partial" && job && message.jobId === job.id && !job.result) {
      job.preview = true;
      ui.base.classList.add("preview");
      ui.base.src = message.image;
    }
  }

  document.addEventListener("mousemove", onMove, { passive: true, capture: true });
  document.addEventListener("scroll", onScroll, { passive: true, capture: true });
  document.addEventListener("dragstart", onDragStart, true);
  document.addEventListener("dragend", onDragEnd, true);
  document.addEventListener("keydown", onKey, true);
  chrome.runtime.onMessage.addListener(onMessage);

  function teardown() {
    document.removeEventListener("mousemove", onMove, { capture: true });
    document.removeEventListener("scroll", onScroll, { capture: true });
    document.removeEventListener("dragstart", onDragStart, true);
    document.removeEventListener("dragend", onDragEnd, true);
    document.removeEventListener("keydown", onKey, true);
    clearInterval(tick);
    host.remove();
  }
})();
