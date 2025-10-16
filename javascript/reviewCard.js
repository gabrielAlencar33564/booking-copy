export async function initReviewCard({
  rootSelector = "#review-card",
  dataUrl = "/data/reviews.json",
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) return console.warn("[reviewCard] container não encontrado:", rootSelector);

  const card = root;

  let data;
  try {
    const res = await fetch(dataUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.error("[reviewCard] erro ao carregar JSON:", e);
    return;
  }

  const el = (sel) => card.querySelector(sel);

  const headTitleEl = el(".rc-head-title-title");
  const headSubEl = el(".rc-head-title-subtitle");
  const headBadgeEl = el(".rc-badge");

  const contentTitle = el(".rc-content-title");
  const contentText = el(".rc-content-review-description");

  const avatarEl = el(".avatar");
  const nameEl = el(".rc-name") || el(".who strong");
  const flagEl = el(".flag");
  const countryEl = el(".country");

  const bottomLabelEl = el(".rc-bottom .label");
  const bottomBadgeEl = el(".rc-bottom .rc-badge--alt");

  const prevBtn = el(".rc-prev") || el(".rc-arrows .rc-arrow:first-child");
  const nextBtn = el(".rc-next") || el(".rc-arrows .rc-arrow:last-child");

  const score = Number(data?.summary?.score ?? 0);
  const label = data?.summary?.label ?? "";
  const count = Number(data?.summary?.count ?? 0);

  if (headTitleEl) headTitleEl.textContent = label;
  if (headSubEl) headSubEl.textContent = `${count} avaliações`;
  if (headBadgeEl)
    headBadgeEl.textContent = score.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  if (bottomLabelEl)
    bottomLabelEl.textContent = data?.summary?.cityNote || "Nota em alta na região";
  const avgCat =
    Array.isArray(data?.categories) && data.categories.length
      ? Math.min(
          10,
          data.categories.reduce((acc, c) => acc + (Number(c.value) || 0), 0) /
            data.categories.length
        )
      : score;

  if (bottomBadgeEl) {
    bottomBadgeEl.textContent = avgCat.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  const reviews = Array.isArray(data?.loved?.reviews) ? data.loved.reviews : [];
  let index = 0;

  function renderReview(i) {
    if (!reviews.length) {
      if (contentTitle) contentTitle.textContent = "Hóspedes que ficaram aqui adoraram";
      if (contentText)
        contentText.textContent = "Seja o primeiro a deixar um comentário!";
      const reviewer = el(".rc-reviewer");
      if (reviewer) reviewer.style.display = "none";
      return;
    }

    const r = reviews[((i % reviews.length) + reviews.length) % reviews.length];

    if (contentTitle) contentTitle.textContent = "Hóspedes que ficaram aqui adoraram";
    if (contentText) contentText.textContent = r.text || "";

    if (avatarEl) {
      if (r.avatar) {
        avatarEl.style.setProperty("background-image", `url("${r.avatar}")`);
        avatarEl.style.setProperty("background-size", "cover");
        avatarEl.style.setProperty("background-position", "center");
        avatarEl.textContent = "";
      } else {
        avatarEl.style.removeProperty("background-image");
        avatarEl.textContent = (r.initial || r.name?.[0] || "?").toUpperCase();
      }
    }
    if (nameEl) nameEl.textContent = r.name || "";
    if (flagEl) flagEl.textContent = r.flag || "";
    if (countryEl) countryEl.textContent = r.country || "";
  }

  renderReview(index);

  prevBtn?.addEventListener("click", () => {
    index = (index - 1 + (reviews.length || 1)) % (reviews.length || 1);
    renderReview(index);
  });
  nextBtn?.addEventListener("click", () => {
    index = (index + 1) % (reviews.length || 1);
    renderReview(index);
  });

  if (!reviews.length) {
    prevBtn?.setAttribute("disabled", "true");
    nextBtn?.setAttribute("disabled", "true");
  }
}

if (document.currentScript?.dataset?.autoinit === "true") {
  initReviewCard().catch(console.error);
}
