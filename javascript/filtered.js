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
    querySync = { enabled: false, role: "writer", debounceMs: 120 },
    defaults = {},
  } = {}) {
    const root =
      typeof roomSelector === "string"
        ? document.querySelector(roomSelector)
        : roomSelector;
    if (!root) {
      console.warn("[initFilters] container não encontrado:", roomSelector);
      return;
    }

    const q = (sel, r) => (r || root).querySelector(sel);
    const qa = (sel, r) => Array.from((r || root).querySelectorAll(sel));
    const pick = (arr, r) => {
      for (const s of arr) {
        const el = q(s, r);
        if (el) return el;
      }
      return null;
    };

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

    const qsEnabled = !!(querySync && querySync.enabled);
    const qsWriter = qsEnabled && (querySync.role || "writer") === "writer";
    const qsDebounceMs =
      typeof querySync?.debounceMs === "number" ? querySync.debounceMs : 120;

    function toQS(val) {
      return typeof val === "string" ? val.trim() : val;
    }
    function parseBool(v) {
      if (v === "1" || v === "true" || v === true) return true;
      if (v === "0" || v === "false" || v === false) return false;
      return !!v;
    }
    const isInt = (n) => Number.isFinite(+n);

    (function applyDefaults() {
      if (!defaults || typeof defaults !== "object") return;
      if (typeof defaults.destination === "string")
        state.destination = defaults.destination;
      if (typeof defaults.checkin === "string") state.checkin = defaults.checkin;
      if (typeof defaults.checkout === "string") state.checkout = defaults.checkout;

      if (isInt(defaults.adults)) state.adults = Math.max(1, +defaults.adults);
      if (isInt(defaults.children)) state.children = Math.max(0, +defaults.children);
      if (isInt(defaults.rooms)) state.rooms = Math.max(1, +defaults.rooms);

      if ("pet" in defaults) state.pet = parseBool(defaults.pet);
    })();

    function readQueryIntoState() {
      try {
        const usp = new URLSearchParams(location.search);
        const destination = usp.get("destination");
        const checkin = usp.get("checkin");
        const checkout = usp.get("checkout");
        const adults = usp.get("adults");
        const children = usp.get("children");
        const rooms = usp.get("rooms");
        const pet = usp.get("pet");
        if (destination) state.destination = destination;
        if (checkin) state.checkin = checkin;
        if (checkout) state.checkout = checkout;
        if (adults && !Number.isNaN(+adults)) state.adults = Math.max(1, +adults);
        if (children && !Number.isNaN(+children)) state.children = Math.max(0, +children);
        if (rooms && !Number.isNaN(+rooms)) state.rooms = Math.max(1, +rooms);
        if (pet != null) state.pet = parseBool(pet);
      } catch (e) {}
    }

    let qsWriteTimer = null;
    function writeStateToQuery() {
      if (!qsEnabled || !qsWriter) return;
      clearTimeout(qsWriteTimer);
      qsWriteTimer = setTimeout(() => {
        try {
          const url = new URL(location.href);
          const p = url.searchParams;
          const setOrDel = (k, v) => {
            const has =
              v !== null &&
              v !== undefined &&
              !(typeof v === "string" && v.trim() === "");
            if (has) p.set(k, v);
            else p.delete(k);
          };

          setOrDel("destination", toQS(state.destination));
          setOrDel("checkin", toQS(state.checkin));
          setOrDel("checkout", toQS(state.checkout));
          setOrDel("adults", state.adults);
          setOrDel("children", state.children);
          setOrDel("rooms", state.rooms);
          setOrDel("pet", state.pet ? "1" : "0");

          const newQs = p.toString();
          const newUrl =
            url.origin + url.pathname + (newQs ? "?" + newQs : "") + url.hash;
          history.replaceState(null, "", newUrl);
        } catch (e) {}
      }, qsDebounceMs);
    }

    function closeAll(except = null) {
      qa(".fb[data-drop]").forEach((wrap) => {
        const drop = q(".fb-drop", wrap);
        const trig = q(".fb-trigger", wrap);
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
      const drop = q(".fb-drop", wrap);
      const trig = q(".fb-trigger", wrap);
      if (!drop) return;
      closeAll(drop);
      drop.hidden = false;
      if (trig) trig.setAttribute("aria-expanded", "true");
      wrap.setAttribute("aria-expanded", "true");
      justOpenedTick = performance.now();
      if (wrap.classList.contains("fb-destination")) {
        const di = pick(
          ["#dest-input", '[data-role="dest-input"]', 'input[aria-controls="dest-list"]'],
          wrap
        );
        di && di.focus();
      }
      if (wrap.classList.contains("fb-dates")) {
        const ci = pick(
          ["#checkin", '[data-role="checkin"]', '[id$="checkin"]', 'input[type="date"]'],
          wrap
        );
        ci && ci.focus();
      }
      if (wrap.classList.contains("fb-guests")) {
        const btn = q('[data-ctr="adult"][data-op="+"]', wrap);
        btn && btn.focus();
      }
    }

    function toggleDrop(wrap) {
      const drop = q(".fb-drop", wrap);
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

    const fmtBR = (s) => {
      if (!s) return "";
      const [Y, M, D] = s.split("-");
      return `${D}/${M}/${Y}`;
    };
    function hydrateUIFromState() {
      const destWrap = q(".fb-destination");
      const destInput = pick(
        ["#dest-input", '[data-role="dest-input"]', 'input[aria-controls="dest-list"]'],
        destWrap
      );
      const destValue = pick(
        ["#dest-value", '[data-role="dest-value"]', ".fb-destination .fb-value"],
        root
      );
      if (destInput) destInput.value = state.destination || "";
      if (destValue) destValue.textContent = state.destination || "Destino";

      const datesWrap = q(".fb-dates");
      const ciEl =
        q('#checkin, [data-role="checkin"], [id$="checkin"]', datesWrap) ||
        q('.fb-dates input[type="date"]', datesWrap);
      const coEl =
        q('#checkout, [data-role="checkout"], [id$="checkout"]', datesWrap) ||
        (function () {
          const ds = qa('.fb-dates input[type="date"]', datesWrap);
          return ds.length > 1 ? ds[1] : null;
        })();
      const labelDates =
        q(".fb-dates .fb-value", datesWrap) ||
        q('#dates-value, [id$="dates-value"]', datesWrap) ||
        q('#dates-value, [id$="dates-value"]', root);

      if (ciEl) ciEl.value = state.checkin || "";
      if (coEl) coEl.value = state.checkout || "";
      if (labelDates) {
        if (state.checkin && state.checkout) {
          labelDates.textContent = `${fmtBR(state.checkin)} - ${fmtBR(state.checkout)}`;
        } else if (state.checkin) {
          labelDates.textContent = `${fmtBR(state.checkin)} - selecionar checkout`;
        } else {
          labelDates.textContent = "Selecione check-in e check-out";
        }
      }

      const guestsWrap = q(".fb-guests");
      const aEl = q("#adult-val, [data-role='adult-val'], [id$='adult-val']", guestsWrap);
      const cEl = q("#child-val, [data-role='child-val'], [id$='child-val']", guestsWrap);
      const rEl = q("#room-val, [data-role='room-val'], [id$='room-val']", guestsWrap);
      const pEl = q("#has-pet, [data-role='has-pet'], [id$='has-pet']", guestsWrap);
      const guestsValue = q(
        '#guests-value, [id$="guests-value"], .fb-guests .fb-value',
        root
      );

      if (aEl) aEl.textContent = state.adults;
      if (cEl) cEl.textContent = state.children;
      if (rEl) rEl.textContent = state.rooms;
      if (pEl) pEl.checked = !!state.pet;

      if (guestsValue) {
        const a = state.adults,
          c = state.children,
          r = state.rooms,
          pet = state.pet ? " · com pet" : "";
        guestsValue.textContent = `${a} adulto${a !== 1 ? "s" : ""} · ${c} criança${
          c !== 1 ? "s" : ""
        } · ${r} quarto${r !== 1 ? "s" : ""}${pet}`;
      }
    }

    (function setupDestination() {
      const destWrap = q(".fb-destination");
      if (!destWrap) return;
      const destInput = pick(
        ["#dest-input", '[data-role="dest-input"]', 'input[aria-controls="dest-list"]'],
        destWrap
      );
      const destList = pick(
        ["#dest-list", '[data-role="dest-list"]', ".dest-list"],
        destWrap
      );
      const destValue = pick(
        ["#dest-value", '[data-role="dest-value"]', ".fb-destination .fb-value"],
        root
      );

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

      function renderDestinos(qterm = "") {
        if (!destList) return;
        const term = qterm.trim().toLowerCase();
        const list = term
          ? destinations.filter((d) =>
              (d.city + " " + d.country).toLowerCase().includes(term)
            )
          : destinations;
        destList.innerHTML = list.length
          ? list.map(itemHTML).join("")
          : `<li class="dest-item-not-found" aria-disabled="true" style="opacity:.6;cursor:default;text-align:center;">
               <div><div class="dest-title">Nenhum destino encontrado</div><div class="dest-sub">Tente outro termo</div></div>
             </li>`;
      }

      destInput &&
        destInput.addEventListener("focus", () => renderDestinos(destInput.value));
      destInput &&
        destInput.addEventListener("input", () => {
          renderDestinos(destInput.value);
          state.destination = destInput.value || "";
          if (destValue) destValue.textContent = state.destination || "Destino";
          writeStateToQuery();
        });
      destInput &&
        destInput.addEventListener("keydown", (e) => {
          if (e.key === "ArrowDown" && destList) {
            const first = destList.querySelector('.dest-item[role="option"]');
            first && first.focus();
            e.preventDefault();
          }
        });

      destList &&
        destList.addEventListener("click", (e) => {
          const li = e.target.closest('.dest-item[role="option"]');
          if (!li || !destList.contains(li)) return;
          const city = li.getAttribute("data-city");
          const country = li.getAttribute("data-country");
          state.destination = `${city}, ${country}`;
          if (destInput) destInput.value = state.destination;
          if (destValue) destValue.textContent = state.destination;
          writeStateToQuery();
          closeAll();
        });

      destList &&
        destList.addEventListener("keydown", (e) => {
          const items = Array.from(
            destList.querySelectorAll('.dest-item[role="option"]')
          );
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
            document.activeElement && document.activeElement.click();
          }
        });
    })();

    (function setupDates() {
      const datesWrap = q(".fb-dates");
      if (!datesWrap) return;

      const label =
        q(".fb-value", datesWrap) ||
        q('#dates-value, [id$="dates-value"]', datesWrap) ||
        q('#dates-value, [id$="dates-value"]', root);
      const ci =
        q('#checkin, [data-role="checkin"], [id$="checkin"]', datesWrap) ||
        q('input[type="date"]', datesWrap);
      const co =
        q('#checkout, [data-role="checkout"], [id$="checkout"]', datesWrap) ||
        (function () {
          const ds = qa('input[type="date"]', datesWrap);
          return ds.length > 1 ? ds[1] : null;
        })();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const toISO = (d) => d.toISOString().slice(0, 10);
      const fmt = (s) => {
        if (!s) return "";
        const [Y, M, D] = s.split("-");
        return `${D}/${M}/${Y}`;
      };

      if (ci) ci.min = toISO(today);
      if (co) co.min = toISO(today);

      function updateDatesLabel() {
        if (!label) return;
        if (state.checkin && state.checkout)
          label.textContent = `${fmt(state.checkin)} - ${fmt(state.checkout)}`;
        else if (state.checkin)
          label.textContent = `${fmt(state.checkin)} - selecionar checkout`;
        else label.textContent = "Selecione check-in e check-out";
      }

      function setCheckin(val) {
        state.checkin = val || "";
        if (co) {
          if (state.checkin) {
            const minOut = new Date(state.checkin);
            minOut.setDate(minOut.getDate() + 1);
            co.min = toISO(minOut);
            if (state.checkout && state.checkout <= state.checkin) {
              state.checkout = "";
              co.value = "";
            }
          } else {
            co.min = toISO(today);
          }
        }
        updateDatesLabel();
        writeStateToQuery();
      }

      function setCheckout(val) {
        state.checkout = val || "";
        updateDatesLabel();
        writeStateToQuery();
      }

      ci && ci.addEventListener("change", (e) => setCheckin(e.target.value));
      co && co.addEventListener("change", (e) => setCheckout(e.target.value));
      ci && ci.addEventListener("input", (e) => setCheckin(e.target.value));
      co && co.addEventListener("input", (e) => setCheckout(e.target.value));

      q('[data-action$="clear-dates"]', datesWrap)?.addEventListener("click", (e) => {
        e.stopPropagation();
        state.checkin = "";
        state.checkout = "";
        if (ci) ci.value = "";
        if (co) {
          co.value = "";
          co.min = toISO(today);
        }
        updateDatesLabel();
        writeStateToQuery();
      });

      q('[data-action$="apply-dates"]', datesWrap)?.addEventListener("click", (e) => {
        e.stopPropagation();
        const drop = datesWrap.closest(".fb[data-drop]");
        if (drop) {
          const d = q(".fb-drop", drop);
          const t = q(".fb-trigger", drop);
          if (d) d.hidden = true;
          if (t) t.setAttribute("aria-expanded", "false");
          drop.setAttribute("aria-expanded", "false");
        }
      });

      const openBtn = datesWrap.querySelector(".fb-trigger");
      openBtn &&
        openBtn.addEventListener("click", () => {
          setTimeout(() => ci && ci.focus(), 0);
        });

      updateDatesLabel();
    })();

    (function setupGuests() {
      const guestsWrap = q(".fb-guests");
      if (!guestsWrap) return;
      const guestsValue = q(
        '#guests-value, [id$="guests-value"], .fb-guests .fb-value',
        root
      );
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
        const wrap = btn.closest(".fb-guests") || guestsWrap || root;
        const valEl =
          q(`#${key}-val`, wrap) ||
          q(`[data-role="${key}-val"]`, wrap) ||
          q(`[id$="${key}-val"]`, wrap);
        if (valEl) valEl.textContent = state[stKey];
        updateGuestsLabel();
        writeStateToQuery();
      });

      root.addEventListener("change", (e) => {
        const tgl = e.target.closest("#has-pet, [data-role='has-pet'], [id$='has-pet']");
        if (!tgl || !root.contains(tgl)) return;
        e.stopPropagation();
        state.pet = !!tgl.checked;
        updateGuestsLabel();
        writeStateToQuery();
      });

      q('[data-action$="clear-guests"]', guestsWrap)?.addEventListener("click", (e) => {
        e.stopPropagation();
        state.adults = 2;
        state.children = 0;
        state.rooms = 1;
        state.pet = false;
        const gw = guestsWrap || root;
        const aEl = q("#adult-val, [data-role='adult-val'], [id$='adult-val']", gw);
        if (aEl) aEl.textContent = 2;
        const cEl = q("#child-val, [data-role='child-val'], [id$='child-val']", gw);
        if (cEl) cEl.textContent = 0;
        const rEl = q("#room-val, [data-role='room-val'], [id$='room-val']", gw);
        if (rEl) rEl.textContent = 1;
        const pEl = q("#has-pet, [data-role='has-pet'], [id$='has-pet']", gw);
        if (pEl) pEl.checked = false;
        updateGuestsLabel();
        writeStateToQuery();
      });

      q('[data-action$="apply-guests"]', guestsWrap)?.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAll();
      });

      updateGuestsLabel();
    })();

    const searchBtn = q(
      '#search-btn, [id$="search-btn"], [data-role="search-btn"]',
      root
    );
    searchBtn &&
      searchBtn.addEventListener("click", () => {
        if (!state.destination) return alert("Escolha um destino.");
        if (!state.checkin || !state.checkout) return alert("Selecione as datas.");
        writeStateToQuery();
        console.log("[PESQUISAR]", roomSelector, JSON.stringify(state, null, 2));
        alert("Buscando… veja os parâmetros no console.");
      });

    if (qsEnabled) {
      readQueryIntoState();
      hydrateUIFromState();
      if (qsWriter) writeStateToQuery();
    } else {
      hydrateUIFromState();
    }

    return {
      getState: () => ({ ...state }),
      destroy: () => {
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onDocKey);
      },
    };
  };
})();
