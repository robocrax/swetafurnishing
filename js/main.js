// Sweta Furnishing — site behaviour. Plain ES module, no dependencies.
// Navigation, header state, reveal-on-scroll, copy-to-clipboard, lightbox (loaded only when needed).

const root = document.documentElement;
const header = document.querySelector("[data-header]");

// ---------- mobile navigation ----------
const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.getElementById("site-nav");
if (toggle && nav) {
  const label = toggle.querySelector(".sr-only");
  const outside = [...document.querySelectorAll("main, footer, .topbar, .mobile-bar")];
  const setOpen = (open) => {
    if (open && header) nav.style.setProperty("--nav-top", `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    toggle.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Close menu" : "Open menu";
    root.classList.toggle("nav-open", open);
    for (const el of outside) el.toggleAttribute("inert", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a[href]")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("nav-open")) { setOpen(false); toggle.focus(); }
  });
  matchMedia("(min-width: 1080px)").addEventListener("change", (m) => { if (m.matches) setOpen(false); });
}

// ---------- header shadow once the page has scrolled ----------
if (header && "IntersectionObserver" in window) {
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:60px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => header.classList.toggle("is-scrolled", !e.isIntersecting)).observe(sentinel);
}

// ---------- reveal on scroll (content stays visible if JS fails) ----------
const revealEls = [...document.querySelectorAll("[data-reveal]")];
if (revealEls.length) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    for (const group of document.querySelectorAll("[data-reveal-stagger]")) {
      [...group.querySelectorAll(":scope > [data-reveal]")].forEach((el, i) => el.style.setProperty("--i", String(i % 6)));
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    const vh = window.innerHeight;
    for (const el of revealEls) {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-in", "no-anim");
      else io.observe(el);
    }
    root.classList.add("reveal-ready");
  }
}

// ---------- copy to clipboard: <button data-copy="text"> with optional [data-copy-label] ----------
const status = document.getElementById("copy-status");
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const text = btn.dataset.copy;
  const ok = await copyText(text);
  const label = btn.querySelector("[data-copy-label]");
  if (label && !label.dataset.orig) label.dataset.orig = label.textContent;
  btn.classList.toggle("is-copied", ok);
  if (label) label.textContent = ok ? "Copied!" : "Copy failed";
  if (status) status.textContent = ok ? `Copied ${text} to the clipboard` : `Couldn’t copy — the email address is ${text}`;
  clearTimeout(btn._copyTimer);
  btn._copyTimer = setTimeout(() => {
    btn.classList.remove("is-copied");
    if (label) label.textContent = label.dataset.orig;
  }, 2400);
});

// ---------- lightbox: only fetched on pages that have a gallery ----------
if (document.querySelector("[data-lightbox]")) {
  import("/js/lightbox.js").then((m) => m.initLightbox());
}

// ---------- keep the footer year current ----------
for (const el of document.querySelectorAll("[data-year]")) el.textContent = String(new Date().getFullYear());
