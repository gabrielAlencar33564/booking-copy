(function () {
  function $(s, r = document) {
    return r.querySelector(s);
  }
  function $$(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }

  const DEFAULT_POPULAR_DESTINATIONS = [
    { city: "Salvador", country: "Brasil" },
    { city: "São Paulo", country: "Brasil" },
    { city: "Aracaju", country: "Brasil" },
    { city: "Porto Seguro", country: "Brasil" },
    { city: "Brasília", country: "Brasil" },
    { city: "Rio de Janeiro", country: "Brasil" },
    { city: "Florianópolis", country: "Brasil" },
    { city: "Cabo Frio", country: "Brasil" },
  ];

  window.initFilters = function initFilters({
    roomSelector = "#filters",
    destinations = DEFAULT_POPULAR_DESTINATIONS,
  } = {}) {
    const root =
      typeof roomSelector === "string"
        ? document.querySelector(roomSelector)
        : roomSelector;
    if (!root) {
      console.warn("[initFilters] container não encontrado:", roomSelector);
      return;
    }

    const state = {
      destination: "",
      checkin: "",
      checkout: "",
      adults: 2,
      children: 0,
      rooms: 1,
      pet: false,
    };

    let justOpenedTick = 0;

    function closeAll(except = null) {
      $$(".fb[data-drop]", root).forEach((wrap) => {
        const drop = $(".fb-drop", wrap);
        const trig = $(".fb-trigger", wrap);
        if (!drop) return;
        const isExcept =
          except && (drop === except || wrap === except || trig === except);
        if (!isExcept) {
          drop.hidden = true;
          if (trig) trig.setAttribute("aria-expanded", "false");
          wrap.setAttribute("aria-expanded", "false");
        }
      });
    }
    function openDrop(wrap) {
      const drop = $(".fb-drop", wrap);
      const trig = $(".fb-trigger", wrap);
      if (!drop) return;
      closeAll(drop);
      drop.hidden = false;
      if (trig) trig.setAttribute("aria-expanded", "true");
      wrap.setAttribute("aria-expanded", "true");
      justOpenedTick = performance.now();

      if (wrap.classList.contains("fb-destination")) $("#dest-input", wrap)?.focus();
      if (wrap.classList.contains("fb-dates")) $("#checkin", wrap)?.focus();
      if (wrap.classList.contains("fb-guests"))
        $('[data-ctr="adult"][data-op="+"]', wrap)?.focus();
    }
    function toggleDrop(wrap) {
      const drop = $(".fb-drop", wrap);
      if (!drop) return;
      drop.hidden ? openDrop(wrap) : closeAll();
    }

    root.addEventListener("click", (e) => {
      const drop = e.target.closest(".fb-drop");
      if (drop && root.contains(drop)) return;
      const card = e.target.closest(".fb[data-drop]");
      if (card && root.contains(card)) toggleDrop(card);
    });

    const onDocClick = (e) => {
      if (performance.now() - justOpenedTick < 5) return;
      if (!root.contains(e.target)) closeAll();
    };
    const onDocKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onDocKey);

    const destWrap = $(".fb-destination", root);
    const destInput = destWrap ? $("#dest-input", destWrap) : null;
    const destList = destWrap ? $("#dest-list", destWrap) : null;

    function itemHTML(obj) {
      return `
        <li class="dest-item" role="option" tabindex="-1"
            data-city="${obj.city.replace(/"/g, "&quot;")}"
            data-country="${obj.country.replace(/"/g, "&quot;")}">
          <span class="material-symbols-outlined">location_on</span>
          <div>
            <div class="dest-title">${obj.city}</div>
            <div class="dest-sub">${obj.country}</div>
          </div>
        </li>`;
    }
    function renderDestinos(q = "") {
      if (!destList) return;
      const term = q.trim().toLowerCase();
      const list = term
        ? destinations.filter((d) =>
            (d.city + " " + d.country).toLowerCase().includes(term)
          )
        : destinations;
      destList.innerHTML = list.length
        ? list.map(itemHTML).join("")
        : `<li class="dest-item" aria-disabled="true" style="opacity:.6;cursor:default;">
             <span class="dest-icon" aria-hidden="true"></span>
             <div><div class="dest-title">Nenhum destino encontrado</div><div class="dest-sub">Tente outro termo</div></div>
           </li>`;
    }
    destInput?.addEventListener("focus", () => renderDestinos(destInput.value));
    destInput?.addEventListener("input", () => renderDestinos(destInput.value));
    destInput?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && destList) {
        const first = destList.querySelector('.dest-item[role="option"]');
        first?.focus();
        e.preventDefault();
      }
    });
    destList?.addEventListener("click", (e) => {
      const li = e.target.closest('.dest-item[role="option"]');
      if (!li) return;
      const city = li.getAttribute("data-city");
      const country = li.getAttribute("data-country");
      state.destination = `${city}, ${country}`;
      if (destInput) destInput.value = state.destination;
      closeAll();
    });
    destList?.addEventListener("keydown", (e) => {
      const items = Array.from(destList.querySelectorAll('.dest-item[role="option"]'));
      const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[Math.min(i + 1, items.length - 1)]?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        items[Math.max(i - 1, 0)]?.focus();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        document.activeElement?.click();
      }
    });

    const datesWrap = $(".fb-dates", root);
    const ci = datesWrap ? $("#checkin", datesWrap) : null;
    const co = datesWrap ? $("#checkout", datesWrap) : null;
    const datesValue = datesWrap ? $("#dates-value", datesWrap) : $("#dates-value", root);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    if (ci) ci.min = toISO(today);
    if (co) co.min = toISO(today);
    const fmt = (s) => {
      if (!s) return "";
      const [Y, M, D] = s.split("-");
      return `${D}/${M}/${Y}`;
    };

    function updateDatesLabel() {
      if (!datesValue) return;
      if (state.checkin && state.checkout)
        datesValue.textContent = `${fmt(state.checkin)} — ${fmt(state.checkout)}`;
      else if (state.checkin)
        datesValue.textContent = `${fmt(state.checkin)} — selecionar checkout`;
      else datesValue.textContent = "Selecione check-in e check-out";
    }

    ci?.addEventListener("change", () => {
      state.checkin = ci.value;
      if (state.checkin && co) {
        const minOut = new Date(state.checkin);
        minOut.setDate(minOut.getDate() + 1);
        co.min = toISO(minOut);
        if (state.checkout && state.checkout <= state.checkin) {
          state.checkout = "";
          co.value = "";
        }
      } else if (co) {
        co.min = toISO(today);
      }
      updateDatesLabel();
    });
    co?.addEventListener("change", () => {
      state.checkout = co.value;
      updateDatesLabel();
    });

    $('[data-action="clear-dates"]', datesWrap || root)?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        state.checkin = "";
        state.checkout = "";
        if (ci) ci.value = "";
        if (co) {
          co.value = "";
          co.min = toISO(today);
        }
        updateDatesLabel();
      }
    );
    $('[data-action="apply-dates"]', datesWrap || root)?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        closeAll();
      }
    );

    const guestsWrap = $(".fb-guests", root);
    const guestsValue = guestsWrap
      ? $("#guests-value", guestsWrap)
      : $("#guests-value", root);
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    function updateGuestsLabel() {
      if (!guestsValue) return;
      const a = state.adults,
        c = state.children,
        r = state.rooms,
        pet = state.pet ? " · com pet" : "";
      guestsValue.textContent = `${a} adulto${a !== 1 ? "s" : ""} · ${c} criança${
        c !== 1 ? "s" : ""
      } · ${r} quarto${r !== 1 ? "s" : ""}${pet}`;
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".ctr-btn");
      if (!btn || !root.contains(btn)) return;
      e.stopPropagation();

      const key = btn.getAttribute("data-ctr");
      const op = btn.getAttribute("data-op");
      const map = { adult: "adults", child: "children", room: "rooms" };
      const limits = { adults: [1, 16], children: [0, 16], rooms: [1, 9] };
      const stKey = map[key];
      if (!stKey) return;

      state[stKey] = clamp(
        state[stKey] + (op === "+" ? 1 : -1),
        limits[stKey][0],
        limits[stKey][1]
      );

      const localWrap = btn.closest(".fb-guests") || guestsWrap || root;
      let valEl =
        localWrap.querySelector(`#${key}-val`) ||
        localWrap.querySelector(`[id$="${key}-val"]`) ||
        $(`#${key}-val`, root);
      if (valEl) valEl.textContent = state[stKey];

      updateGuestsLabel();
    });

    const petToggle = guestsWrap ? $("#has-pet", guestsWrap) : $("#has-pet", root);
    petToggle?.addEventListener("change", (e) => {
      e.stopPropagation();
      state.pet = e.target.checked;
      updateGuestsLabel();
    });

    $('[data-action="clear-guests"]', guestsWrap || root)?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        state.adults = 2;
        state.children = 0;
        state.rooms = 1;
        state.pet = false;

        const wrap = guestsWrap || root;
        const aEl = wrap.querySelector("#adult-val");
        if (aEl) aEl.textContent = 2;
        const cEl = wrap.querySelector("#child-val");
        if (cEl) cEl.textContent = 0;
        const rEl = wrap.querySelector("#room-val");
        if (rEl) rEl.textContent = 1;
        const pEl = wrap.querySelector("#has-pet");
        if (pEl) pEl.checked = false;

        updateGuestsLabel();
      }
    );
    $('[data-action="apply-guests"]', guestsWrap || root)?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        closeAll();
      }
    );

    $("#search-btn", root)?.addEventListener("click", () => {
      console.log("[PESQUISAR]", roomSelector, JSON.stringify(state, null, 2));
      if (!state.destination) return alert("Escolha um destino.");
      if (!state.checkin || !state.checkout) return alert("Selecione as datas.");
      alert("Buscando… veja os parâmetros no console.");
    });

    updateDatesLabel();
    updateGuestsLabel();

    return {
      getState: () => ({ ...state }),
      destroy: () => {
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onDocKey);
      },
    };
  };
})();
