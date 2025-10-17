(function () {
  function $(s, el) {
    return (el || document).querySelector(s);
  }
  function $$(s, el) {
    return Array.from((el || document).querySelectorAll(s));
  }
  function readDataset(dataArg, dataKey) {
    if (dataArg && typeof dataArg === "object") return dataArg;
    if (window.DATASETS && window.DATASETS[dataKey || "reviews"]) {
      return window.DATASETS[dataKey || "reviews"];
    }
    return {};
  }

  function buildAsideReviewsVertical() {
    var aside = document.getElementById("gm-aside");
    if (!aside) return;
    var ds = readDataset(null, "reviews") || {};
    var sum = ds.summary || {};
    var loved = ds.loved && Array.isArray(ds.loved.reviews) ? ds.loved.reviews : [];
    var categories = Array.isArray(ds.categories) ? ds.categories : [];

    var badge = document.getElementById("gm-badge");
    var label = document.getElementById("gm-label");
    var count = document.getElementById("gm-count");
    if (badge && typeof sum.score === "number")
      badge.textContent = sum.score.toLocaleString("pt-BR");
    if (label && typeof sum.label === "string") label.textContent = sum.label;
    if (count)
      count.textContent = (sum.count || 0).toLocaleString("pt-BR") + " avaliações";

    var list = document.getElementById("gm-review-list");
    if (!list) return;

    var titleLi = document.getElementById("gm-review-title");
    var titleText = titleLi ? titleLi.textContent : "Os hóspedes amaram ficar aqui";
    list.innerHTML = "";
    var newTitle = document.createElement("li");
    newTitle.className = "gm-review-title";
    newTitle.textContent = titleText;
    list.appendChild(newTitle);

    loved.forEach(function (d) {
      var li = document.createElement("li");
      li.className = "gm-review-item";

      var p = document.createElement("p");
      p.className = "gm-review-text";
      p.textContent = d.text || "";
      li.appendChild(p);

      var reviewer = document.createElement("div");
      reviewer.className = "gm-review-reviewer";

      var avatar = document.createElement("div");
      avatar.className = "reviewer-avatar";
      if (d.avatar) {
        avatar.style.backgroundImage = 'url("' + d.avatar + '")';
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.textContent = "";
      } else {
        var initial = (d.initial || (d.name && d.name[0]) || "?")
          .toString()
          .toUpperCase();
        avatar.textContent = initial;
      }

      var who = document.createElement("div");
      who.className = "reviewer-who";

      var name = document.createElement("span");
      name.className = "reviewer-name";
      name.textContent = d.name || "";

      var flag = document.createElement("span");
      flag.className = "reviewer-flag";
      flag.textContent = d.flag || "";

      var country = document.createElement("span");
      country.className = "reviewer-country";
      country.textContent = d.country || "";

      who.appendChild(name);
      who.appendChild(flag);
      who.appendChild(country);

      reviewer.appendChild(avatar);
      reviewer.appendChild(who);

      li.appendChild(reviewer);
      list.appendChild(li);
    });

    var catLi = document.createElement("li");
    catLi.className = "gm-review-item";

    var catTitle = document.createElement("h3");
    catTitle.className = "gm-review-topics-label";
    catTitle.textContent = "Categorias:";
    catLi.appendChild(catTitle);

    var grid = document.createElement("div");
    grid.className = "gm-review-rev-sum-grid";
    catLi.appendChild(grid);

    var col1 = document.createElement("ul");
    var col2 = document.createElement("ul");
    var col3 = document.createElement("ul");
    col1.className = "gm-review-rev-sum-list";
    col2.className = "gm-review-rev-sum-list";
    col3.className = "gm-review-rev-sum-list";
    grid.appendChild(col1);
    grid.appendChild(col2);
    grid.appendChild(col3);

    function makeCatItem(cat) {
      var li = document.createElement("li");
      li.className = "gm-review-rev-sum-item";

      var name = document.createElement("span");
      name.className = "gm-review-rev-sum-name";
      name.textContent = cat.name || "";

      if (cat.trend === "up" || cat.trend === "down") {
        var trend = document.createElement("span");
        trend.className = "gm-review-rev-sum-trend";
        trend.innerHTML =
          '<span class="ms">' +
          (cat.trend === "up" ? "trending_up" : "trending_down") +
          "</span>";
        name.appendChild(trend);
      }

      var valNum = Number(cat.value) || 0;
      var value = document.createElement("span");
      value.className = "gm-review-rev-sum-value";
      value.textContent = valNum.toLocaleString("pt-BR");

      var bar = document.createElement("span");
      bar.className =
        "gm-review-rev-sum-bar" + (valNum >= 9.8 ? " gm-review-rev-sum-bar--ok" : "");
      var pct = Math.min(100, Math.max(0, valNum * 10));
      bar.style.setProperty("--val", pct + "%");

      li.appendChild(name);
      li.appendChild(value);
      li.appendChild(bar);
      return li;
    }

    categories.forEach(function (cat, i) {
      var col = i % 3;
      var item = makeCatItem(cat);
      if (col === 0) col1.appendChild(item);
      else if (col === 1) col2.appendChild(item);
      else col3.appendChild(item);
    });

    if (ds.summary && ds.summary.cityNote) {
      var note = document.createElement("li");
      note.className = "gm-review-rev-sum-note";
      note.innerHTML =
        '<span class="ms">' +
        (ds.summary.trendIcon || "trending_up") +
        "</span> " +
        ds.summary.cityNote;
      col3.appendChild(note);
    }

    list.appendChild(catLi);
  }

  var modal = document.getElementById("galleryModal");
  if (!modal) return;
  var dialog = modal.querySelector(".gm-dialog");
  var closeBtn = modal.querySelector(".gm-close");
  var gallery = document.getElementById("gallery");

  function openModal() {
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
  }

  if (gallery) {
    gallery.addEventListener("click", function (e) {
      var trigger = e.target.closest("img, figure, .gallery-image, .gm-thumb");
      if (trigger) openModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closeModal();
    });
  }

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  if (dialog) {
    dialog.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildAsideReviewsVertical);
  } else {
    buildAsideReviewsVertical();
  }
})();
