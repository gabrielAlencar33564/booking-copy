(function () {
  function readDataset(dataArg, dataKey) {
    if (dataArg && typeof dataArg === "object") return dataArg;
    if (window.DATASETS && window.DATASETS[dataKey || "rooms"])
      return window.DATASETS[dataKey || "rooms"];
    return {};
  }

  function buildUrlWithPageQueryParams(targetUrl) {
    const REQUIRED_KEYS = ["checkin", "checkout", "adults", "children", "rooms"];

    const toInt = (v) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : NaN;
    };
    const isValidISODate = (s) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
      const d = new Date(s);

      return !isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
    };

    const currentParams = new URLSearchParams(location.search);

    const missing = REQUIRED_KEYS.filter(
      (k) => !currentParams.has(k) || currentParams.get(k) === ""
    );
    if (missing.length > 0) {
      alert(
        "Preencha os dados obrigatórios antes de continuar:\n" +
          missing
            .map((k) => {
              switch (k) {
                case "checkin":
                  return "• Check-in (YYYY-MM-DD)";
                case "checkout":
                  return "• Check-out (YYYY-MM-DD)";
                case "adults":
                  return "• Quantidade de adultos";
                case "children":
                  return "• Quantidade de crianças";
                case "rooms":
                  return "• Quantidade de quartos";
                default:
                  return `• ${k}`;
              }
            })
            .join("\n")
      );
      return null;
    }

    const checkin = currentParams.get("checkin");
    const checkout = currentParams.get("checkout");
    const adults = toInt(currentParams.get("adults"));
    const children = toInt(currentParams.get("children"));
    const rooms = toInt(currentParams.get("rooms"));

    const errors = [];
    if (!isValidISODate(checkin))
      errors.push("• Check-in deve estar no formato YYYY-MM-DD.");
    if (!isValidISODate(checkout))
      errors.push("• Check-out deve estar no formato YYYY-MM-DD.");
    if (isValidISODate(checkin) && isValidISODate(checkout)) {
      const dIn = new Date(checkin);
      const dOut = new Date(checkout);
      if (!(dOut > dIn)) errors.push("• Check-out deve ser posterior ao check-in.");
    }
    if (!Number.isFinite(adults) || adults < 1)
      errors.push("• Adultos deve ser um número ≥ 1.");
    if (!Number.isFinite(children) || children < 0)
      errors.push("• Crianças deve ser um número ≥ 0.");
    if (!Number.isFinite(rooms) || rooms < 1)
      errors.push("• Quartos deve ser um número ≥ 1.");

    if (errors.length > 0) {
      alert("Alguns valores estão inválidos:\n" + errors.join("\n"));
      return null;
    }

    try {
      const finalUrl = new URL(targetUrl, location.href);
      currentParams.forEach((value, key) => {
        finalUrl.searchParams.set(key, value);
      });
      return finalUrl.toString();
    } catch (e) {
      if (!location.search || location.search === "?") return targetUrl;
      if (/\?/.test(targetUrl)) {
        return targetUrl + "&" + location.search.replace(/^\?/, "");
      }
      return targetUrl + location.search;
    }
  }

  function navigateViaParentHash(url) {
    if (!url) return;
    const merged = buildUrlWithPageQueryParams(url);
    if (!merged) return;
    window.open(merged, "_self");
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

      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (!a.href || a.href.endsWith("#")) return;
        navigateViaParentHash(a.href);
      });
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
