export async function initReviews({
  rootSelector = ".reviews",
  dataUrl = "/assets/data/reviews.json",
} = {}) {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const root = $(rootSelector);
  if (!root) {
    console.warn("[reviews] container não encontrado:", rootSelector);
    return;
  }

  let data = null;
  try {
    const res = await fetch(dataUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.error("[reviews] erro ao carregar JSON:", e);
    return;
  }

  const titleEl = $(".title-content .title", root);
  const ctaEl = $(".title-content .btn.btn-primary", root);
  if (titleEl && data.header?.title) titleEl.textContent = data.header.title;
  if (ctaEl && data.header?.ctaLabel) {
    ctaEl.textContent = data.header.ctaLabel;
    if (data.header?.ctaUrl && data.header.ctaUrl !== "#") {
      ctaEl.addEventListener("click", () => window.location.assign(data.header.ctaUrl));
    }
  }

  const badge = $(".rev-sum__badge", root);
  const label = $(".rev-sum__label", root);
  const readAll = $(".rev-sum__meta .link", root);

  if (badge && typeof data.summary?.score === "number")
    badge.textContent = data.summary.score.toLocaleString("pt-BR");
  if (label && data.summary) {
    const strong = document.createElement("strong");
    strong.textContent = data.summary.label || "";
    label.innerHTML = "";
    label.appendChild(strong);
    label.appendChild(
      document.createTextNode(` • ${data.summary.count ?? 0} avaliações`)
    );
  }
  if (readAll && data.summary?.readAllUrl) {
    readAll.setAttribute("href", data.summary.readAllUrl);
  }

  const thirdColList = $$(".rev-sum__list", root)[2];
  if (thirdColList && data.summary?.cityNote) {
    let noteItem = $(".rev-sum__note", thirdColList);
    if (!noteItem) {
      noteItem = document.createElement("li");
      noteItem.className = "rev-sum__note";
      thirdColList.appendChild(noteItem);
    }
    noteItem.innerHTML = `
      <span class="ms">${data.summary.trendIcon || "trending_up"}</span>
      ${data.summary.cityNote}
    `;
  }

  const lists = $$(".rev-sum__list", root);
  if (lists.length >= 3 && Array.isArray(data.categories)) {
    lists.forEach((ul, idx) => {
      const keepNote = $(".rev-sum__note", ul);
      ul.innerHTML = "";
      if (keepNote && idx === 2) ul.appendChild(keepNote);
    });

    const makeItem = (cat) => {
      const li = document.createElement("li");
      li.className = "rev-sum__item";

      const name = document.createElement("span");
      name.className = "rev-sum__name";
      name.textContent = cat.name || "";

      if (cat.trend === "up") {
        const trend = document.createElement("span");
        trend.className = "rev-sum__trend";
        trend.innerHTML = `<span class="ms">trending_up</span>`;
        name.appendChild(trend);
      } else if (cat.trend === "down") {
        const trend = document.createElement("span");
        trend.className = "rev-sum__trend";
        trend.innerHTML = `<span class="ms">trending_down</span>`;
        name.appendChild(trend);
      }

      const val = Number(cat.value) || 0;
      const value = document.createElement("span");
      value.className = "rev-sum__value";
      value.textContent = val.toLocaleString("pt-BR");

      const bar = document.createElement("span");
      bar.className = "rev-sum__bar" + (val >= 9.8 ? " rev-sum__bar--ok" : "");
      bar.style.setProperty("--val", `${Math.min(100, Math.max(0, val * 10))}%`);

      li.appendChild(name);
      li.appendChild(value);
      li.appendChild(bar);
      return li;
    };

    data.categories.forEach((cat, i) => {
      const col = i % 3;
      lists[col].appendChild(makeItem(cat));
    });

    const note = $(".rev-sum__note", lists[2]);
    if (note) lists[2].appendChild(note);
  }

  const topicsWrap = $(".topics__wrap", root);
  if (topicsWrap && Array.isArray(data.topics)) {
    topicsWrap.innerHTML = "";
    data.topics.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-secondary-secondary";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      btn.innerHTML = `<span class="chip__plus">+</span><span>${t}</span>`;
      btn.addEventListener("click", () => {
        const sel = btn.getAttribute("aria-selected") === "true";
        btn.setAttribute("aria-selected", String(!sel));
        btn.classList.toggle("is-selected", !sel);
      });
      topicsWrap.appendChild(btn);
    });
  }

  const loved = $("#loved", root);
  const track = $("#lovedTrack", loved);
  const btnPrev = $(".rv-prev", loved);
  const btnNext = $(".rv-next", loved);
  const cfg = data.loved || {
    itemsPerView: { desktop: 3, tablet: 2, mobile: 1 },
    reviews: [],
  };

  const perView = () => {
    const w = window.innerWidth;
    if (w < 640) return cfg.itemsPerView?.mobile ?? 1;
    if (w < 1024) return cfg.itemsPerView?.tablet ?? 2;
    return cfg.itemsPerView?.desktop ?? 3;
  };

  const renderLoved = () => {
    track.innerHTML = (cfg.reviews || [])
      .map(
        (d) => `
      <article class="rv-card">
        <div class="rv-head">
          ${
            d.avatar
              ? `<img class="rv-avatar" src="${d.avatar}" alt="Foto de ${d.name}">`
              : `<div class="rv-avatar rv-avatar--initial">${(
                  d.initial ||
                  d.name?.[0] ||
                  "?"
                ).toUpperCase()}</div>`
          }
          <div class="rv-who">
            <strong class="rv-name">${d.name || ""}</strong>
            <div class="rv-country"><span class="rv-flag">${d.flag || ""}</span> ${
          d.country || ""
        }</div>
          </div>
        </div>
        <blockquote class="rv-text">${d.text || ""}</blockquote>
        ${d.link ? `<a href="${d.link}" class="rv-more">Saiba mais</a>` : ``}
      </article>
    `
      )
      .join("");
  };

  renderLoved();

  let index = 0,
    cardWidth = 0,
    pv = perView();
  const gap = () => parseFloat(getComputedStyle(track).gap || 0);

  function measure() {
    pv = perView();
    const wrapW = loved.querySelector(".loved-wrap").clientWidth;
    cardWidth = (wrapW - gap() * (pv - 1)) / pv;
    $$(".rv-card", track).forEach((c) => (c.style.width = `${cardWidth}px`));
    index = Math.min(index, Math.max(0, track.children.length - pv));
    update();
  }
  function update() {
    const x = index * (cardWidth + gap());
    track.style.transform = `translateX(${-x}px)`;
    const maxIndex = Math.max(0, track.children.length - pv);
    btnPrev.disabled = index <= 0;
    btnNext.disabled = index >= maxIndex;
  }

  btnPrev?.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    update();
  });
  btnNext?.addEventListener("click", () => {
    const maxIndex = Math.max(0, track.children.length - pv);
    index = Math.min(maxIndex, index + 1);
    update();
  });

  document.addEventListener("keydown", (e) => {
    if (!loved.matches(":hover, :focus-within")) return;
    if (e.key === "ArrowLeft") btnPrev?.click();
    if (e.key === "ArrowRight") btnNext?.click();
  });
  let startX = 0,
    dragging = false;
  track.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    track.style.transform = `translateX(${-index * (cardWidth + gap()) + dx}px)`;
  });
  track.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    const threshold = cardWidth * 0.25;
    if (dx > threshold) btnPrev?.click();
    else if (dx < -threshold) btnNext?.click();
    else update();
  });

  window.addEventListener("resize", () => {
    clearTimeout(window.__rvT);
    window.__rvT = setTimeout(measure, 80);
  });
  measure();
}

if (document.currentScript?.dataset?.autoinit === "true") {
  initReviews().catch(console.error);
}
