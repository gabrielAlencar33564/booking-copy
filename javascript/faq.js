export async function initFaq({
  rootSelector = ".faq",
  dataUrl = "/assets/data/faq.json",
} = {}) {
  const $ = (s, el = document) => el.querySelector(s);

  const root = $(rootSelector);
  if (!root) {
    console.warn("[faq] container não encontrado:", rootSelector);
    return;
  }

  let data;
  try {
    const res = await fetch(dataUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("[faq] erro ao carregar JSON:", err);
    return;
  }

  const titleEl = $(".title-content .title", root);
  const ctaEl = $(".title-content .btn.btn-primary", root);

  if (titleEl) titleEl.textContent = data.header?.title ?? "Perguntas frequentes";
  if (ctaEl) {
    ctaEl.textContent = data.header?.ctaLabel ?? "Veja a disponibilidade";
    const url = data.header?.ctaUrl;
    if (url && url !== "#") {
      ctaEl.addEventListener("click", () => window.location.assign(url));
    }
  }

  const grid = $(".faq-grid", root);
  if (!grid) {
    console.warn("[faq] .faq-grid não encontrado");
    return;
  }

  grid.innerHTML = "";

  const columns = Math.max(1, Number(data.lists?.columns ?? 2));
  const icons = {
    left: data.lists?.icons?.left || "forum",
    right: data.lists?.icons?.right || "chevron_right",
  };

  const colEls = [];
  for (let i = 0; i < columns; i++) {
    const card = document.createElement("div");
    card.className = "faq-card";
    card.setAttribute("role", "list");

    const ul = document.createElement("ul");
    ul.className = "faq-list";
    card.appendChild(ul);

    grid.appendChild(card);
    colEls.push(ul);
  }

  const items = Array.isArray(data.lists?.items) ? data.lists.items : [];
  items.forEach((it, idx) => {
    const ul = colEls[idx % columns];
    ul.appendChild(makeItem(it, icons));
  });

  const cta = data.ctaPanel;
  if (cta) {
    const ctaWrap = document.createElement("div");
    ctaWrap.className = "faq-cta";

    const h3 = document.createElement("h3");
    h3.id = "faq-title";
    h3.className = "faq-cta-title";
    h3.textContent = cta.title ?? "Ainda não encontrou a resposta?";
    ctaWrap.appendChild(h3);

    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.type = "button";
    btn.textContent = cta.buttonLabel ?? "Faça uma pergunta";
    if (cta.buttonUrl && cta.buttonUrl !== "#") {
      btn.addEventListener("click", () => window.location.assign(cta.buttonUrl));
    }
    ctaWrap.appendChild(btn);

    const p = document.createElement("p");
    p.className = "faq-cta-note";
    p.textContent = cta.note ?? "";
    ctaWrap.appendChild(p);

    grid.appendChild(ctaWrap);
  }

  const readAllBtn = $(".btn.btn-primary-outline", root);
  if (readAllBtn) {
    readAllBtn.textContent = data.readAll?.label ?? "Ler todas as perguntas";
    const readUrl = data.readAll?.url;
    if (readUrl && readUrl !== "#") {
      readAllBtn.addEventListener("click", () => window.location.assign(readUrl));
    }
  }

  function makeItem(item, icons) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "faq-item";
    a.href = item.href || "#";

    const left = document.createElement("span");
    left.className = "ms ms-bubbles";
    left.setAttribute("aria-hidden", "true");
    left.textContent = icons.left;

    const text = document.createTextNode(" " + (item.label || "") + " ");

    const right = document.createElement("span");
    right.className = "ms ms-arrow";
    right.setAttribute("aria-hidden", "true");
    right.textContent = icons.right;

    a.appendChild(left);
    a.appendChild(text);
    a.appendChild(right);

    li.appendChild(a);
    return li;
  }
}

if (document.currentScript?.dataset?.autoinit === "true") {
  initFaq().catch(console.error);
}
