(function () {
  function readDataset(dataArg, dataKey) {
    if (dataArg && typeof dataArg === "object") return dataArg;
    if (window.DATASETS && window.DATASETS[dataKey || "rooms"])
      return window.DATASETS[dataKey || "rooms"];
    return {};
  }

  // Util: navegar no roteador do documento pai (index.html) quando estiver dentro do iframe
  function navigateViaParentHash(url) {
    const isIframe = window.parent && window.parent !== window;
    const targetWin = isIframe ? window.parent : window;

    if (!url) return;

    // Se houver API pública do Router, use-a (mais elegante)
    if (url.startsWith("#/")) {
      const hash = url; // ex: "#/your-data?room=dbl-std"
      if (targetWin.Router && typeof targetWin.Router.navigate === "function") {
        const withoutHash = hash.slice(1); // "/your-data?room=dbl-std"
        const [pathname, qs] = withoutHash.split("?");
        const params = new URLSearchParams(qs || "");
        targetWin.Router.navigate(pathname, params);
      } else {
        // fallback: altera o hash da janela alvo
        targetWin.location.hash = hash;
      }
      return;
    }

    // Caso seja uma URL "normal" (http/arquivo local), abre do jeito padrão
    window.open(url, "_self");
  }

  window.initRooms = function initRooms({
    rootSelector = "#rooms",
    data,
    dataKey = "rooms",
  } = {}) {
    const root = document.querySelector(rootSelector);
    if (!root) {
      console.warn("[rooms] container não encontrado:", rootSelector);
      return;
    }

    const head = root.querySelector(".rooms__head");

    let labels = {};
    let rooms = [];

    const dataset = readDataset(data, dataKey);
    if (dataset.labels) labels = { ...labels, ...dataset.labels };
    rooms = Array.isArray(dataset.rooms) ? dataset.rooms : [];

    if (head) {
      const [c1, c2, c3] = head.children;
      if (c1) c1.textContent = labels.type || "Tipo de quarto";
      if (c2) c2.textContent = labels.people || "Quantas pessoas?";
      if (c3) c3.textContent = "";
    }

    [...root.querySelectorAll(".rooms__row")].forEach((el) => el.remove());

    const el = (tag, cls, html) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    };

    const toPersonsIcons = (n) => {
      const wrap = el("div", "people");
      for (let i = 0; i < n; i++) {
        const s = el("span", "ms");
        s.textContent = "person";
        wrap.appendChild(s);
      }
      return wrap;
    };

    const bedMetaItem = (b) => {
      const span = el("span", "rooms__meta-item");
      const i = el("span", "ms");
      i.textContent = b.icon || "king_bed";
      span.appendChild(i);

      const text = [];
      if (b.count && b.count > 1) {
        text.push(`${b.count} ${b.label || labels.doubleBed || "cama"}`);
      } else {
        text.push(`1 ${b.label || labels.doubleBed || "cama"}`);
      }
      span.appendChild(document.createTextNode(" " + text.join("")));
      return span;
    };

    const buildRow = (room) => {
      const row = el("div", "rooms__row");

      const cellType = el("div", "rooms__cell rooms__cell--type");
      const a = el("a", "link link-underline");
      a.href = room.url || "#";
      a.textContent = room.name || "";
      cellType.appendChild(a);

      const meta = el("div", "rooms__meta");
      (room.beds || []).forEach((b) => meta.appendChild(bedMetaItem(b)));
      cellType.appendChild(meta);

      const cellPeople = el("div", "rooms__cell rooms__cell--people");
      const capacity = Number(room.capacity) || 1;
      cellPeople.setAttribute(
        "aria-label",
        `Capacidade: ${capacity} ${capacity > 1 ? "pessoas" : "pessoa"}`
      );
      cellPeople.appendChild(toPersonsIcons(capacity));

      const cellAction = el("div", "rooms__cell rooms__cell--action");
      const btn = el("button", "btn btn-primary");
      btn.type = "button";
      btn.textContent =
        room.cta && room.cta.label
          ? room.cta.label
          : labels.action || "Visualizar preços";
      btn.addEventListener("click", () => {
        const url = (room.cta && room.cta.url) || room.url || "#";
        if (!url || url === "#") return;
        navigateViaParentHash(url);
      });
      cellAction.appendChild(btn);

      row.appendChild(cellType);
      row.appendChild(cellPeople);
      row.appendChild(cellAction);

      return row;
    };

    const frag = document.createDocumentFragment();
    rooms.forEach((room) => frag.appendChild(buildRow(room)));
    root.appendChild(frag);

    window.filterRoomsByCapacity = (minCap = 1) => {
      [...root.querySelectorAll(".rooms__row")].forEach((row) => {
        const capLabel =
          row.querySelector(".rooms__cell--people")?.getAttribute("aria-label") || "";
        const found = capLabel.match(/(\d+)/);
        const cap = found ? Number(found[1]) : 1;
        row.style.display = cap >= minCap ? "" : "none";
      });
    };

    window.sortRoomsByCapacityAsc = () => sortByCapacity(true);
    window.sortRoomsByCapacityDesc = () => sortByCapacity(false);

    function sortByCapacity(asc = true) {
      const rows = [...root.querySelectorAll(".rooms__row")];
      rows.sort((a, b) => {
        const capA = Number(
          (
            a.querySelector(".rooms__cell--people")?.getAttribute("aria-label") || ""
          ).match(/(\d+)/)?.[1] || 1
        );
        const capB = Number(
          (
            b.querySelector(".rooms__cell--people")?.getAttribute("aria-label") || ""
          ).match(/(\d+)/)?.[1] || 1
        );
        return asc ? capA - capB : capB - capA;
      });
      rows.forEach((r) => root.appendChild(r));
    }
  };
})();
