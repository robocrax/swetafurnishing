// <dialog>-based lightbox (adapted from sitekit/client/lightbox.js).
// Markup: <a href="large.webp" data-lightbox="group" data-caption="…"><picture>…</picture></a>
// Keyboard (←/→/Esc), swipe, focus return, preloads neighbours. Styles: .lb* in /css/site.css.
export function initLightbox(selector = "[data-lightbox]") {
  const links = [...document.querySelectorAll(selector)];
  if (!links.length) return;
  let dlg, img, cap, count, items = [], idx = 0;

  const build = () => {
    dlg = document.createElement("dialog");
    dlg.className = "lb";
    dlg.setAttribute("aria-label", "Photo viewer");
    dlg.innerHTML = `
      <figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>
      <button class="lb-btn lb-close" type="button" aria-label="Close">&times;</button>
      <button class="lb-btn lb-prev" type="button" aria-label="Previous photo">&#8249;</button>
      <button class="lb-btn lb-next" type="button" aria-label="Next photo">&#8250;</button>
      <p class="lb-count" aria-live="polite"></p>`;
    document.body.append(dlg);
    img = dlg.querySelector(".lb-img");
    cap = dlg.querySelector(".lb-cap");
    count = dlg.querySelector(".lb-count");
    dlg.querySelector(".lb-close").onclick = () => dlg.close();
    dlg.querySelector(".lb-prev").onclick = () => show(idx - 1);
    dlg.querySelector(".lb-next").onclick = () => show(idx + 1);
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.classList.contains("lb-figure")) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("close", () => {
      document.documentElement.classList.remove("lb-open");
      items[idx]?.focus({ preventScroll: true });
    });
    let x0 = null;
    dlg.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  };

  const show = (i) => {
    idx = (i + items.length) % items.length;
    const a = items[idx];
    img.classList.remove("is-loaded");
    img.onload = () => img.classList.add("is-loaded");
    img.src = a.getAttribute("href");
    img.alt = a.querySelector("img")?.alt || "";
    cap.textContent = a.dataset.caption || "";
    cap.hidden = !a.dataset.caption;
    count.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : "";
    dlg.classList.toggle("lb-single", items.length < 2);
    for (const n of [idx + 1, idx - 1]) {
      const b = items[(n + items.length) % items.length];
      if (b) new Image().src = b.getAttribute("href");
    }
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest(selector);
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (!dlg) build();
    items = [...document.querySelectorAll(selector)].filter((x) => x.dataset.lightbox === a.dataset.lightbox && x.offsetParent !== null);
    if (!items.includes(a)) items = [a];
    document.documentElement.classList.add("lb-open");
    dlg.showModal();
    show(items.indexOf(a));
  });
}
