export async function initRooms({
  rootSelector = "#rooms",
  dataUrl = "/assets/data/rooms.json",
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) {
    console.warn("[rooms] container não encontrado:", rootSelector);
    return;
  }

  const head = root.querySelector(".rooms__head");

  let labels = {};
  let rooms = [];

  try {
    const res = await fetch(dataUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.labels) labels = { ...labels, ...json.labels };
    rooms = Array.isArray(json.rooms) ? json.rooms : [];
  } catch (e) {
    console.error("[rooms] erro ao carregar JSON:", e);
    rooms = [];
  }

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
      room.cta && room.cta.label ? room.cta.label : labels.action || "Visualizar preços";

    btn.addEventListener("click", () => {
      const url = (room.cta && room.cta.url) || room.url || "#";
      const tgt = (room.cta && room.cta.target) || "_self";
      if (url && url !== "#") window.open(url, tgt);
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
        (a.querySelector(".rooms__cell--people")?.getAttribute("aria-label") || "").match(
          /(\d+)/
        )?.[1] || 1
      );
      const capB = Number(
        (b.querySelector(".rooms__cell--people")?.getAttribute("aria-label") || "").match(
          /(\d+)/
        )?.[1] || 1
      );
      return asc ? capA - capB : capB - capA;
    });
    rows.forEach((r) => root.appendChild(r));
  }
}

if (document.currentScript?.dataset?.autoinit === "true") {
  initRooms().catch(console.error);
}
