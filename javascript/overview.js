(function () {
  function $(s, el) {
    return (el || document).querySelector(s);
  }
  function $$(s, el) {
    return Array.from((el || document).querySelectorAll(s));
  }
  function readDataset(dataArg, key) {
    if (dataArg && typeof dataArg === "object") return dataArg;
    return (window.DATASETS && window.DATASETS[key || "overview"]) || {};
  }

  window.initOverview = function initOverview(opts = {}) {
    const {
      rootSelector = ".overview-info",
      headerSelector = ".overview-header-left",
      mapsSelector = "#maps",
      data,
      dataKey = "overview",
    } = opts;

    const ds = readDataset(data, dataKey);

    (function renderLogo() {
      const box = $("#logo-header");
      const h = ds.header || {};
      if (!box) return;
      if (!h.logoUrl) return;

      const img = document.createElement("img");
      img.className = "logo-img";
      img.src = h.logoUrl;
      img.alt = h.title || "Logo";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";

      let node = img;
      if (h.mapUrl && h.mapUrl !== "#") {
        const a = document.createElement("a");
        a.href = h.mapUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", "Abrir mapa");
        a.appendChild(img);
        node = a;
      }

      box.innerHTML = "";
      box.appendChild(node);
    })();

    (function renderMap() {
      const box = $(mapsSelector);
      const h = ds.header || {};
      if (!box) return;
      if (!h.mapUrl) return;

      box.innerHTML = "";
      const a = document.createElement("a");
      a.href = h.mapUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", "Abrir mapa");

      const img = document.createElement("img");
      img.className = "maps-img";
      img.src = h.mapUrl;
      img.alt = h.title ? `Mapa — ${h.title}` : "Mapa";
      img.loading = "lazy";
      img.decoding = "async";

      a.appendChild(img);
      box.appendChild(a);
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
            : ds.header.mapUrl || "#";
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
      console.warn("[overview] container não encontrado:", rootSelector);
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
              "Casais particularmente gostam da localização — eles deram nota") + " "
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
    document.addEventListener("DOMContentLoaded", () => window.initOverview());
  } else {
    window.initOverview();
  }
})();
