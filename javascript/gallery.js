(function () {
  function ensureArray(x) {
    return Array.isArray(x) ? x : [];
  }

  function normalizeItemsPerView(ipv, fallback) {
    const base = fallback || { desktop: 5, tablet: 4, mobile: 3 };
    if (!ipv) return base;
    return {
      desktop: Number(ipv.desktop) || base.desktop,
      tablet: Number(ipv.tablet) || base.tablet,
      mobile: Number(ipv.mobile) || base.mobile,
    };
  }

  function makeFig({ cls = "", url = "", alt = "", more = 0 }) {
    const fig = document.createElement("figure");
    fig.className = `gallery-image ${cls}`.trim();
    fig.setAttribute("role", "img");
    fig.setAttribute("aria-label", alt || "Imagem da galeria");
    fig.style.backgroundImage = `url("${url}")`;
    fig.style.backgroundSize = "cover";
    fig.style.cursor = "pointer";
    fig.style.backgroundRepeat = "no-repeat";
    fig.style.backgroundPosition = "center";
    if (more > 0) {
      fig.classList.add("is-more");
      const badge = document.createElement("div");
      badge.className = "more-badge";
      badge.textContent = `Mais ${more}`;
      fig.appendChild(badge);
    }
    return fig;
  }

  function readDatasetExplicit(dataArg, dataKey) {
    if (dataArg && typeof dataArg === "object") return dataArg;
    if (dataKey && window.DATASETS && window.DATASETS[dataKey]) {
      return window.DATASETS[dataKey];
    }
    if (window.DATASETS && window.DATASETS.gallery) return window.DATASETS.gallery;
    return null;
  }

  window.initGallery = function initGallery({
    rootSelector = "#gallery",
    data,
    dataKey = "gallery",
  } = {}) {
    const root = document.querySelector(rootSelector);
    if (!root) {
      console.warn("[gallery] container não encontrado:", rootSelector);
      return;
    }

    const main = root.querySelector("#gallery-main");
    const sub = root.querySelector("#gallery-sub");
    if (!main || !sub) {
      console.warn("[gallery] falta #gallery-main ou #gallery-sub");
      return;
    }

    const dataset = readDatasetExplicit(data, dataKey) || {};
    const images = ensureArray(dataset.images);
    const itemsPerView = normalizeItemsPerView(dataset.itemsPerView, {
      desktop: 5,
      tablet: 4,
      mobile: 3,
    });

    const mqMobile = matchMedia("(max-width: 768px)");
    const mqTablet = matchMedia("(max-width: 1024px)");
    const isMobile = () => mqMobile.matches;
    const isTablet = () => !isMobile() && mqTablet.matches;
    const isDesktop = () => !mqTablet.matches;

    function render() {
      main.innerHTML = "";
      sub.innerHTML = "";

      const subSlots = isDesktop()
        ? itemsPerView.desktop
        : isTablet()
        ? itemsPerView.tablet
        : itemsPerView.mobile;

      root.style.setProperty("--sub-cols", String(subSlots));

      if (!isMobile()) {
        const mainSlice = images.slice(0, 3);
        const subSlice = images.slice(3, 3 + subSlots);
        const visible = 3 + subSlice.length;
        const extra = Math.max(0, images.length - visible);

        if (mainSlice[0])
          main.appendChild(
            makeFig({ cls: "image-1", url: mainSlice[0], alt: "Imagem principal 1" })
          );
        if (mainSlice[1])
          main.appendChild(
            makeFig({ cls: "image-2", url: mainSlice[1], alt: "Imagem principal 2" })
          );
        if (mainSlice[2])
          main.appendChild(
            makeFig({ cls: "image-3", url: mainSlice[2], alt: "Imagem principal 3" })
          );

        subSlice.forEach((url, i) => {
          const isLast = i === subSlice.length - 1;
          sub.appendChild(
            makeFig({
              url,
              alt: `Imagem ${3 + i + 1} da galeria`,
              more: isLast && extra > 0 ? extra : 0,
            })
          );
        });
      } else {
        const mainSlice = images.slice(0, 1);
        const subCandidates = images.slice(1, 1 + subSlots + 2);
        const subSlice = subCandidates.slice(0, subSlots);
        const visible = 1 + subSlice.length;
        const extra = Math.max(0, images.length - visible) + 2;

        if (mainSlice[0]) {
          main.appendChild(
            makeFig({ cls: "image-1", url: mainSlice[0], alt: "Imagem principal" })
          );
        }

        subSlice.forEach((url, i) => {
          const isLast = i === subSlice.length - 1;
          sub.appendChild(
            makeFig({
              url,
              alt: `Imagem ${1 + i + 1} da galeria`,
              more: isLast && extra > 0 ? extra : 0,
            })
          );
        });
      }
    }

    render();

    let t;
    const handle = () => {
      clearTimeout(t);
      t = setTimeout(render, 80);
    };
    addEventListener("resize", handle);
    mqMobile.addEventListener?.("change", handle);
    mqTablet.addEventListener?.("change", handle);
  };
})();
