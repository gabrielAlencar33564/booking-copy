(function () {
  function $(s, el) {
    return (el || document).querySelector(s);
  }
  function $$(s, el) {
    return Array.from((el || document).querySelectorAll(s));
  }

  const SafeSession = {
    get(k) {
      try {
        return window.sessionStorage.getItem(k);
      } catch (_) {
        return null;
      }
    },
    set(k, v) {
      try {
        window.sessionStorage.setItem(k, v);
      } catch (_) {}
    },
    remove(k) {
      try {
        window.sessionStorage.removeItem(k);
      } catch (_) {}
    },
    getJSON(k) {
      const s = this.get(k);
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch (_) {
        return null;
      }
    },
    setJSON(k, obj) {
      try {
        this.set(k, JSON.stringify(obj));
      } catch (_) {}
    },
  };

  function getNavType() {
    try {
      const e =
        performance.getEntriesByType && performance.getEntriesByType("navigation");
      if (e && e[0] && e[0].type) return e[0].type;
      const t = performance && performance.navigation && performance.navigation.type;
      if (t === 1) return "reload";
      if (t === 2) return "back_forward";
      return "navigate";
    } catch (_) {
      return "navigate";
    }
  }

  function getTimerKey() {
    const w = window || {};
    const prop =
      (w.APP_DATA && w.APP_DATA.property) ||
      (w.DATASETS && w.DATASETS.property) ||
      w.property ||
      {};
    let pid =
      prop.id ||
      prop.slug ||
      (prop.branding && prop.branding.name) ||
      (prop.hero && prop.hero.title) ||
      location.pathname ||
      "default";
    pid = String(pid)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 64);
    return `resv_timer:v2:${pid || "default"}`;
  }

  function getPromotionalData() {
    const w = window || {};
    const promo =
      (w.APP_DATA && w.APP_DATA.property.promotional) ||
      (w.DATASETS && w.DATASETS.property.promotional) ||
      w.property.promotional ||
      {};
    const title =
      typeof promo.title === "string" && promo.title.trim()
        ? promo.title.trim()
        : "Complete sua reserva...";
    let totalSeconds = 0;
    if (typeof promo.timer === "number") totalSeconds = promo.timer;
    else if (typeof promo.timer === "string") {
      const n = Number(promo.timer);
      totalSeconds = Number.isFinite(n) ? n : 0;
    }
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    return { title, totalSeconds };
  }

  function initReservationTimer(opts = {}) {
    const {
      bannerSelector = "#reservation-timer-banner",
      titleSelector = ".timer-title",
      hoursSelector = "#hours",
      minutesSelector = "#minutes",
      secondsSelector = "#seconds",
      displaySelector = "#countdown-timer",
      closeBtnSelector = "#close-timer-btn",
      autoShow = true,
    } = opts;

    const banner = $(bannerSelector);
    if (!banner) return;

    const titleEl = $(titleSelector, banner);
    const hoursEl = $(hoursSelector, banner);
    const minutesEl = $(minutesSelector, banner);
    const secondsEl = $(secondsSelector, banner);
    const timerDisplay = $(displaySelector, banner);
    const closeBtn = $(closeBtnSelector, banner);

    const { title, totalSeconds } = getPromotionalData();
    if (titleEl) titleEl.textContent = title;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return;

    if (banner.dataset.timerIntervalId) {
      const prev = Number(banner.dataset.timerIntervalId);
      if (prev) clearInterval(prev);
      delete banner.dataset.timerIntervalId;
    }

    const fmt2 = (n) => String(n).padStart(2, "0");
    function paint(h, m, s) {
      if (hoursEl) hoursEl.textContent = fmt2(h);
      if (minutesEl) minutesEl.textContent = fmt2(m);
      if (secondsEl) secondsEl.textContent = fmt2(s);
    }

    const STORAGE_KEY = getTimerKey();
    const navType = getNavType();
    if (navType === "reload") SafeSession.remove(STORAGE_KEY);

    const saved = SafeSession.getJSON(STORAGE_KEY);
    const now = Date.now();
    let deadlineMs;

    if (saved && typeof saved.deadlineMs === "number" && saved.deadlineMs > now) {
      deadlineMs = saved.deadlineMs;
    } else {
      deadlineMs = now + totalSeconds * 1000;
      SafeSession.setJSON(STORAGE_KEY, {
        deadlineMs,
        originSeconds: totalSeconds,
        createdAt: now,
      });
    }

    let remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
    if (remaining <= 0) {
      paint(0, 0, 0);
      SafeSession.remove(STORAGE_KEY);
      return;
    }

    if (autoShow) banner.style.display = "block";

    paint(
      Math.floor(remaining / 3600),
      Math.floor((remaining % 3600) / 60),
      Math.floor(remaining % 60)
    );

    const id = setInterval(() => {
      remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(id);
        paint(0, 0, 0);
        delete banner.dataset.timerIntervalId;
        SafeSession.remove(STORAGE_KEY);
        return;
      }
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = Math.floor(remaining % 60);
      paint(h, m, s);
      if (!document.body.contains(banner)) {
        clearInterval(id);
        delete banner.dataset.timerIntervalId;
      }
    }, 1000);

    banner.dataset.timerIntervalId = String(id);

    if (closeBtn) {
      closeBtn.addEventListener(
        "click",
        () => {
          try {
            const running = Number(banner.dataset.timerIntervalId);
            if (running) clearInterval(running);
          } catch (_) {}
          delete banner.dataset.timerIntervalId;
          banner.style.display = "none";
          SafeSession.remove(STORAGE_KEY);
        },
        { once: true }
      );
    }

    banner.__setTimerTitle = function (t) {
      if (titleEl) titleEl.textContent = t || "Complete sua reserva...";
    };
  }
  window.initReservationTimer = initReservationTimer;

  window.resetReservationTimer = function () {
    SafeSession.remove(getTimerKey());
    try {
      window.initReservationTimer();
    } catch (_) {}
  };

  window.getReservationTimerRemaining = function () {
    const saved = SafeSession.getJSON(getTimerKey());
    if (!saved || typeof saved.deadlineMs !== "number") return 0;
    return Math.max(0, Math.floor((saved.deadlineMs - Date.now()) / 1000));
  };

  function isOverviewShape(obj) {
    return obj && typeof obj === "object" && obj.header && (obj.left || obj.right);
  }
  function isPropertyShape(obj) {
    return obj && typeof obj === "object" && obj.hero && obj.branding;
  }

  function normalizeFromProperty(prop) {
    return {
      logoUrl: prop.media?.logoUrl || prop.branding?.logoUrl || "",
      mapUrl: prop.media?.mapImageUrl || prop.links?.maps || "#",
      header: {
        title: prop.hero?.title || prop.branding?.name || "",
        addressText:
          prop.hero?.address?.fullText ||
          [
            prop.hero?.address?.line1,
            prop.hero?.address?.city,
            prop.hero?.address?.region,
            prop.hero?.address?.postalCode,
            prop.hero?.address?.country,
          ]
            .filter(Boolean)
            .join(", "),
        addressLinkLabel:
          prop.hero?.address?.linkLabel || "Localização excelente – mostrar o mapa",
        addressLinkUrl: prop.hero?.address?.linkUrl || prop.links?.maps || "#",
        pinIcon: prop.hero?.address?.pinIcon || "location_on",
      },
      left: {
        paragraphs: prop.about?.paragraphs || [],
        couplesScore: prop.scores?.couples?.value ?? null,
        couplesLinePrefix:
          prop.scores?.couples?.labelPrefix ||
          "Casais particularmente gostam da localização, eles deram nota",
        distanceNote: prop.about?.notes?.distanceAttribution || "",
        amenitiesTitle: "Ótimo para sua estadia",
        amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
      },
      right: {
        title: "Destaques da acomodação",
        city: prop.scores?.location?.city || prop.hero?.address?.city || "",
        locationScore: prop.scores?.location?.value ?? null,
        locationPrefix:
          prop.scores?.location?.labelPrefix || "Localizado na área mais bem avaliada em",
        ctaLabel: prop.hero?.primaryCta?.label || "Reservar agora",
        ctaUrl: prop.hero?.primaryCta?.url || prop.links?.reservations || "#",
      },
    };
  }

  function normalizeInput(dataArg, key) {
    if (isOverviewShape(dataArg)) return dataArg;
    if (isPropertyShape(dataArg)) return normalizeFromProperty(dataArg);
    const fromProperty = (window.APP_DATA && window.APP_DATA.property) || null;
    if (isPropertyShape(fromProperty)) return normalizeFromProperty(fromProperty);
    const dsOverview = (window.DATASETS && window.DATASETS[key || "overview"]) || {};
    return dsOverview;
  }

  window.initOverview = function initOverview(opts = {}) {
    const {
      rootSelector = ".overview-info",
      headerSelector = ".overview-header-left",
      mapsSelector = "#maps",
      data,
      dataKey = "overview",
    } = opts;

    const ds = normalizeInput(data, dataKey);

    (function renderLogo() {
      const box = $("#logo-header");
      const h = ds.header || {};
      if (!box || !ds.logoUrl) return;
      const img = document.createElement("img");
      img.className = "logo-img";
      img.src = ds.logoUrl;
      img.alt = h.title || "Logo";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      box.innerHTML = "";
      box.appendChild(img);
    })();

    (function renderMap() {
      const box = $(mapsSelector);
      const h = ds.header || {};
      if (!box || !ds.mapUrl) return;
      const img = document.createElement("img");
      img.className = "maps-img";
      img.src = ds.mapUrl;
      img.alt = h.title ? `Mapa, ${h.title}` : "Mapa";
      img.loading = "lazy";
      img.decoding = "async";
      box.innerHTML = "";
      box.appendChild(img);
    })();

    const header = $(headerSelector);
    if (header && ds.header) {
      const h1 = $(".title", header) || header.querySelector("h1");
      if (h1) h1.textContent = ds.header.title || "";

      let addr = $(".overview-address", header);
      if (!addr) {
        addr = document.createElement("div");
        addr.className = "overview-address";
        header.appendChild(addr);
      }
      addr.innerHTML = "";

      const pin = document.createElement("span");
      pin.className = "address-pin ms";
      pin.setAttribute("aria-hidden", "true");
      pin.textContent = ds.header.pinIcon || "location_on";

      const textNode = document.createTextNode(" " + (ds.header.addressText || ""));

      let link;
      if (ds.header.addressLinkLabel) {
        link = document.createElement("a");
        link.className = "link address-link";
        link.textContent = " " + ds.header.addressLinkLabel;
        const url =
          ds.header.addressLinkUrl && ds.header.addressLinkUrl !== "#"
            ? ds.header.addressLinkUrl
            : ds.mapUrl || "#";
        link.href = url;
        if (url && url !== "#") {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener");
        }
      }

      addr.appendChild(pin);
      addr.appendChild(textNode);
      if (link) addr.appendChild(link);
    }

    const root = $(rootSelector);
    if (!root) {
      return;
    }

    const left = $(".overview-info-left", root);
    const right = $(".overview-info-right", root);

    if (left && ds.left) {
      left.innerHTML = "";

      if (Array.isArray(ds.left.paragraphs)) {
        ds.left.paragraphs.forEach((txt) => {
          const p = document.createElement("p");
          p.textContent = txt;
          left.appendChild(p);
        });
      }

      if (typeof ds.left.couplesScore === "number") {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = ds.left.couplesScore.toLocaleString("pt-BR");
        p.append(
          document.createTextNode(
            (ds.left.couplesLinePrefix ||
              "Casais particularmente gostam da localização, eles deram nota") + " "
          ),
          strong,
          document.createTextNode(" para viagem a dois.")
        );
        left.appendChild(p);
      }

      if (ds.left.distanceNote) {
        const p = document.createElement("p");
        p.className = "distance-note";
        p.textContent = ds.left.distanceNote;
        left.appendChild(p);
      }

      if (ds.left.amenitiesTitle) {
        const h3 = document.createElement("h3");
        h3.className = "amenities-title";
        h3.textContent = ds.left.amenitiesTitle;
        left.appendChild(h3);
      }

      const ul = document.createElement("ul");
      ul.className = "amenities-list";
      (ds.left.amenities || []).forEach((item) => {
        const li = document.createElement("li");
        li.className = "amenity";
        const ic = document.createElement("span");
        ic.className = "amenity-icon ms";
        ic.setAttribute("aria-hidden", "true");
        ic.textContent = item.icon || "check";
        const label = document.createElement("span");
        label.textContent = item.label || "";
        li.appendChild(ic);
        li.appendChild(label);
        ul.appendChild(li);
      });
      left.appendChild(ul);
    }

    if (right && ds.right) {
      const title = $(".highlights-title", right);
      if (title) title.textContent = ds.right.title || "Destaques da acomodação";

      const row = $(".highlight-row", right);
      if (row) {
        const spanText = row.querySelector("span:last-of-type");
        const score =
          typeof ds.right.locationScore === "number"
            ? ds.right.locationScore.toLocaleString("pt-BR")
            : "—";
        const city = ds.right.city || "";
        const prefix =
          ds.right.locationPrefix || "Localizado na área mais bem avaliada em";
        if (spanText) {
          spanText.innerHTML = `${prefix} ${city}, este hotel tem uma ótima nota de localização de <strong>${score}</strong>.`;
        }
      }

      const btn = $(".highlights-cta", right);
      if (btn) {
        btn.textContent = ds.right.ctaLabel || "Reservar agora";
        btn.addEventListener("click", () => {
          const url = ds.right.ctaUrl || "#";
          if (url && url !== "#") window.location.assign(url);
        });
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.initOverview();
      window.initReservationTimer();
    });
  } else {
    window.initOverview();
    window.initReservationTimer();
  }
})();
