(function () {
  function q(s, el) {
    return (el || document).querySelector(s);
  }
  function readDataset(dataArg, dataKey) {
    if (dataArg && typeof dataArg === "object") return dataArg;
    if (window.DATASETS && window.DATASETS[dataKey || "faq"]) {
      return window.DATASETS[dataKey || "faq"];
    }
    return {};
  }

  window.initFaq = function initFaq({
    rootSelector = "#faq",
    data,
    dataKey = "faq",
  } = {}) {
    const root = q(rootSelector);
    if (!root) {
      console.warn("[faq] container não encontrado:", rootSelector);
      return;
    }

    const dataset = readDataset(data, dataKey);
    const header = dataset.header || {};
    const lists = dataset.lists || {};
    const items = Array.isArray(lists.items) ? lists.items : [];
    const columns = Math.max(1, Number(lists.columns || 2));
    const icons = {
      left: (lists.icons && lists.icons.left) || "forum",
      right: (lists.icons && lists.icons.right) || "chevron_right",
    };

    const titleEl = q(".title-content .title", root);
    const ctaEl = q(".title-content .btn.btn-primary", root);
    if (titleEl) titleEl.textContent = header.title || "Perguntas frequentes";
    if (ctaEl) {
      ctaEl.textContent = header.ctaLabel || "Veja a disponibilidade";
      const url = header.ctaUrl;
      if (url && url !== "#")
        ctaEl.addEventListener("click", () => window.location.assign(url));
    }

    const grid = q(".faq-grid", root);
    if (!grid) {
      console.warn("[faq] .faq-grid não encontrado");
      return;
    }
    grid.innerHTML = "";

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

    items.forEach((it, idx) => {
      const ul = colEls[idx % columns];
      ul.appendChild(makeItem(it, icons));
    });

    const cta = dataset.ctaPanel;
    if (cta) {
      const ctaWrap = document.createElement("div");
      ctaWrap.className = "faq-cta";
      const h3 = document.createElement("h3");
      h3.id = "faq-title";
      h3.className = "faq-cta-title";
      h3.textContent = cta.title || "Ainda não encontrou a resposta?";
      ctaWrap.appendChild(h3);
      const btn = document.createElement("button");
      btn.className = "btn btn-primary";
      btn.type = "button";
      btn.textContent = cta.buttonLabel || "Faça uma pergunta";
      if (cta.buttonUrl && cta.buttonUrl !== "#") {
        btn.addEventListener("click", () => window.location.assign(cta.buttonUrl));
      }
      ctaWrap.appendChild(btn);
      const p = document.createElement("p");
      p.className = "faq-cta-note";
      p.textContent = cta.note || "";
      ctaWrap.appendChild(p);
      grid.appendChild(ctaWrap);
    }

    const readAllBtn = q(".btn.btn-primary-outline", root);
    if (readAllBtn) {
      readAllBtn.textContent =
        (dataset.readAll && dataset.readAll.label) || "Ler todas as perguntas";
      const readUrl = dataset.readAll && dataset.readAll.url;
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
  };
})();
