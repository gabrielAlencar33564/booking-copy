(function () {
  var GAP = 12;
  var ROW_GAP = 12;
  var RADIUS = 8;

  var __cache = null;

  function $(s, el) {
    return (el || document).querySelector(s);
  }
  function debounce(fn, t) {
    var id;
    return function () {
      clearTimeout(id);
      id = setTimeout(fn, t || 120);
    };
  }

  function getImages() {
    var ds = (window.DATASETS && window.DATASETS.gallery) || {};
    return Array.isArray(ds.images) ? ds.images : [];
  }

  function preload(urls) {
    if (__cache && __cache.length === urls.length) return Promise.resolve(__cache);
    var jobs = urls.map(function (src) {
      return new Promise(function (res) {
        var im = new Image();
        im.onload = function () {
          var w = im.naturalWidth || 1200,
            h = im.naturalHeight || 800;
          res({ src: src, ar: w / h });
        };
        im.onerror = function () {
          res({ src: src, ar: 3 / 2 });
        };
        im.src = src;
      });
    });
    return Promise.all(jobs).then(function (list) {
      __cache = list;
      return list;
    });
  }

  function distributeRemainder(widths, remainder) {
    for (var i = 0; remainder > 0 && i < widths.length; i++, remainder--) widths[i] += 1;
    return widths;
  }

  function getContainerWidth(el) {
    if (!el) return 0;
    var w = Math.floor(el.getBoundingClientRect().width);
    if (w > 0) return w;
    if (el.parentElement) {
      var pw = Math.floor(el.parentElement.getBoundingClientRect().width);
      if (pw > 0) return pw;
    }
    return Math.max(320, Math.floor(window.innerWidth || 1024));
  }

  function targetRowHeight() {
    var w = window.innerWidth || 1024;
    if (w < 480) return 140;
    if (w < 768) return 170;
    if (w < 1024) return 190;
    return 220;
  }

  function applyUniformRadius(fig) {
    fig.style.border = "0";
    fig.style.borderRadius = RADIUS + "px";
    fig.style.borderTopLeftRadius = RADIUS + "px";
    fig.style.borderTopRightRadius = RADIUS + "px";
    fig.style.borderBottomRightRadius = RADIUS + "px";
    fig.style.borderBottomLeftRadius = RADIUS + "px";
    var img = fig.querySelector("img");
    if (img) {
      img.style.border = "0";
      img.style.borderRadius = "inherit";
      img.style.borderTopLeftRadius = "inherit";
      img.style.borderTopRightRadius = "inherit";
      img.style.borderBottomRightRadius = "inherit";
      img.style.borderBottomLeftRadius = "inherit";
    }
  }

  function buildJustifiedFixed() {
    var grid = $("#gm-grid");
    if (!grid) return;

    var urls = getImages();
    if (!urls.length) {
      grid.innerHTML = "";
      return;
    }

    var containerW = getContainerWidth(grid);
    if (containerW <= 1) {
      setTimeout(buildJustifiedFixed, 120);
      return;
    }

    var target = targetRowHeight();
    var MIN_H = Math.max(110, Math.round(target * 0.7));
    var MAX_H = Math.round(target * 1.2);

    preload(urls).then(function (items) {
      grid.innerHTML = "";
      grid.style.padding = "0";
      grid.style.margin = "0";
      grid.style.border = "0";
      grid.style.borderRadius = "0";
      grid.style.lineHeight = "0";
      grid.style.fontSize = "0";
      grid.style.background = "transparent";

      var row = [],
        sumAR = 0;

      function flushRow(isLast) {
        if (!row.length) return;

        var n = row.length;
        var totalGaps = GAP * (n - 1);

        var rowH = (containerW - totalGaps) / sumAR;

        rowH = Math.max(MIN_H, Math.min(MAX_H, Math.round(rowH)));

        var rawW = row.map(function (it) {
          return rowH * it.ar;
        });
        var widths = rawW.map(function (w) {
          return Math.floor(w);
        });
        var used = widths.reduce(function (a, b) {
          return a + b;
        }, 0);
        var remainder = containerW - totalGaps - used;
        if (remainder > 0) distributeRemainder(widths, remainder);

        var rowEl = document.createElement("div");
        rowEl.className = "jg-row";
        rowEl.style.display = "flex";
        rowEl.style.columnGap = GAP + "px";
        rowEl.style.margin = "0";
        rowEl.style.marginBottom = ROW_GAP + "px";
        rowEl.style.lineHeight = "0";
        rowEl.style.fontSize = "0";

        for (var i = 0; i < n; i++) {
          var fig = document.createElement("figure");
          fig.className = "jg-item";
          fig.style.width = widths[i] + "px";
          fig.style.height = rowH + "px";
          fig.style.position = "relative";
          fig.style.overflow = "hidden";
          fig.style.margin = "0";
          fig.style.boxShadow = "none";
          fig.style.background = "transparent";

          var img = document.createElement("img");
          img.src = row[i].src;
          img.alt = "Imagem da galeria";
          img.style.display = "block";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";

          fig.appendChild(img);
          applyUniformRadius(fig);

          rowEl.appendChild(fig);
        }

        grid.appendChild(rowEl);
        row = [];
        sumAR = 0;
      }

      items.forEach(function (info) {
        row.push(info);
        sumAR += info.ar;
        var totalGaps = GAP * (row.length - 1);
        var rowWifTarget = target * sumAR + totalGaps;
        if (rowWifTarget >= containerW) flushRow(false);
      });

      flushRow(true);

      var rows = grid.querySelectorAll(".jg-row");
      if (rows.length) rows[rows.length - 1].style.marginBottom = "0";
    });
  }

  function init() {
    buildJustifiedFixed();
    var onResize = debounce(buildJustifiedFixed, 150);
    window.addEventListener("resize", onResize);

    var modal = document.getElementById("galleryModal");
    if (modal && window.MutationObserver) {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].attributeName === "aria-hidden")
            setTimeout(buildJustifiedFixed, 60);
        }
      });
      mo.observe(modal, { attributes: true });
    }

    var grid = $("#gm-grid");
    if (grid && window.ResizeObserver) {
      var ro = new ResizeObserver(debounce(buildJustifiedFixed, 120));
      ro.observe(grid);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
