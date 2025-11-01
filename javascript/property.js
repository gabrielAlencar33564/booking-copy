document.addEventListener("DOMContentLoaded", () => {
  const data = window.APP_DATA.property;

  (function applyUserDetailsFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);

      const has = (k) => params.has(k) && params.get(k) !== "";
      const toInt = (v, dflt) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : dflt;
      };
      const toBool = (v, dflt = false) => {
        if (v == null) return dflt;
        const s = String(v).toLowerCase();
        if (s === "1" || s === "true") return true;
        if (s === "0" || s === "false") return false;
        return dflt;
      };

      data.userDetails = data.userDetails || {
        destination: "",
        checkin: "",
        checkout: "",
        adults: 2,
        children: 0,
        rooms: 1,
        pet: false,
      };

      if (has("destination")) data.userDetails.destination = params.get("destination");
      if (has("checkin")) data.userDetails.checkin = params.get("checkin");
      if (has("checkout")) data.userDetails.checkout = params.get("checkout");
      if (has("adults"))
        data.userDetails.adults = toInt(params.get("adults"), data.userDetails.adults);
      if (has("children"))
        data.userDetails.children = toInt(
          params.get("children"),
          data.userDetails.children
        );
      if (has("rooms"))
        data.userDetails.rooms = toInt(params.get("rooms"), data.userDetails.rooms);
      if (has("pet"))
        data.userDetails.pet = toBool(params.get("pet"), data.userDetails.pet);
    } catch (_) {}
  })();

  const titleEl = document.querySelector(".hotel-card__title");
  if (titleEl) titleEl.textContent = data.branding.name;

  const imageEl = document.querySelector(".hotel-card__image");
  if (imageEl) imageEl.src = data.branding.logoUrl;

  const addressEl = document.querySelector(".hotel-card__address");
  if (addressEl) addressEl.textContent = data.hero.address.fullText;

  const locationEl = document.querySelector(".hotel-card__location");
  if (locationEl)
    locationEl.innerHTML = `${data.scores.location.labelPrefix} ${data.scores.location.city} - <strong>${data.scores.location.value}</strong>`;

  const badgeEl = document.querySelector(".hotel-card__review-badge");
  if (badgeEl) badgeEl.textContent = data.scores.couples.value;

  const reviewTitleEl = document.querySelector(".hotel-card__review-title-title");
  if (reviewTitleEl) reviewTitleEl.textContent = data.scores.label;

  const reviewSubtitleEl = document.querySelector(".hotel-card__review-title-subtitle");
  if (reviewSubtitleEl) reviewSubtitleEl.textContent = `${data.scores.count} avaliações`;

  const amenitiesContainer = document.querySelector(".hotel-card__amenities");
  if (amenitiesContainer) {
    amenitiesContainer.innerHTML = "";
    data.amenities.forEach((amenity) => {
      const iconSpan = document.createElement("span");
      iconSpan.className = "material-symbols-outlined";
      iconSpan.textContent = amenity.icon;

      const labelSpan = document.createElement("span");
      labelSpan.className = "hotel-card__amenity";
      labelSpan.textContent = amenity.label;

      amenitiesContainer.appendChild(iconSpan);
      amenitiesContainer.appendChild(labelSpan);
    });
  }

  const checkinEl = document.querySelector(".hotel-card-booking-details__prohibited");
  const checkoutEl = document.querySelector(".hotel-card-booking-details__exit");
  if (checkinEl && checkoutEl) {
    const checkinDate = new Date(data.userDetails.checkin);
    const checkoutDate = new Date(data.userDetails.checkout);

    if (!isNaN(checkinDate)) {
      const target =
        checkinEl.children && checkinEl.children[1] ? checkinEl.children[1] : null;
      if (target) {
        target.textContent = checkinDate.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    if (!isNaN(checkoutDate)) {
      const target =
        checkoutEl.children && checkoutEl.children[1] ? checkoutEl.children[1] : null;
      if (target) {
        target.textContent = checkoutDate.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
  }

  (function () {
    const durationEl = document.querySelector(
      ".hotel-card-booking-details__duration-value"
    );
    if (!durationEl) return;

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    function startOfDayUTC(d) {
      const x = new Date(d);
      return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
    }
    function plural(n, singular, plural) {
      return n === 1 ? singular : plural;
    }
    function diffMonthsAndDays(start, end) {
      const s = startOfDayUTC(start);
      const e = startOfDayUTC(end);
      let months =
        (e.getUTCFullYear() - s.getUTCFullYear()) * 12 +
        (e.getUTCMonth() - s.getUTCMonth());

      let anchor = new Date(
        Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + months, s.getUTCDate())
      );
      if (anchor > e) {
        months -= 1;
        anchor = new Date(
          Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + months, s.getUTCDate())
        );
      }

      const days = Math.floor((e - anchor) / MS_PER_DAY);
      return { months: Math.max(0, months), days: Math.max(0, days) };
    }

    const start = new Date(data.userDetails.checkin);
    const end = new Date(data.userDetails.checkout);

    if (!isNaN(start) && !isNaN(end) && end > start) {
      const { months, days } = diffMonthsAndDays(start, end);

      if (months >= 1) {
        const parts = [];
        parts.push(`${months} ${plural(months, "mês", "meses")}`);
        if (days > 0) parts.push(`${days} ${plural(days, "dia", "dias")}`);
        durationEl.textContent = parts.join(" e ");
      } else {
        const totalDays = Math.ceil(
          (startOfDayUTC(end) - startOfDayUTC(start)) / MS_PER_DAY
        );
        if (totalDays >= 7) {
          const weeks = Math.floor(totalDays / 7);
          const remDays = totalDays % 7;
          const parts = [];
          parts.push(`${weeks} ${plural(weeks, "semana", "semanas")}`);
          if (remDays > 0) parts.push(`${remDays} ${plural(remDays, "dia", "dias")}`);
          durationEl.textContent = parts.join(" e ");
        } else {
          durationEl.textContent = `${totalDays} ${plural(totalDays, "dia", "dias")}`;
        }
      }
    } else {
      durationEl.textContent = "0 dias";
    }
  })();

  const expansionSubtitle = document.querySelector(
    ".hotel-card-booking-details__expansion-subtitle"
  );
  if (expansionSubtitle) {
    const u = data.userDetails || {};
    const r = Number.isFinite(+u.rooms) ? +u.rooms : 1;
    const a = Number.isFinite(+u.adults) ? +u.adults : 2;
    const c = Number.isFinite(+u.children) ? +u.children : 0;
    expansionSubtitle.textContent = `${r} quarto(s) para ${a} adulto(s) e ${c} criança(s)`;
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  function startOfDayUTC(d) {
    const x = new Date(d);
    return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
  }
  function nightsBetween(checkin, checkout) {
    const ci = new Date(checkin);
    const co = new Date(checkout);
    if (isNaN(ci) || isNaN(co) || co <= ci) return 1;
    const n = Math.round((startOfDayUTC(co) - startOfDayUTC(ci)) / MS_PER_DAY);
    return Math.max(1, n);
  }
  function normalizePrice(v) {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const s = String(v || "")
      .replace(/\s/g, "")
      .replace(/[Rr]\$?/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  function parseDiscount(discount, baseTotal) {
    let amount = 0;
    if (typeof discount === "string" && discount.trim().endsWith("%")) {
      const pct = parseFloat(discount);
      if (Number.isFinite(pct) && pct > 0) amount = baseTotal * (pct / 100);
    } else {
      const n = normalizePrice(discount);
      if (n > 0 && n < 1) amount = baseTotal * n;
      else if (n >= 1) amount = Math.min(baseTotal, n);
    }
    return Math.max(0, Math.min(amount, baseTotal));
  }

  const nightlyPrice = normalizePrice(data.price);
  const nights = nightsBetween(data.userDetails.checkin, data.userDetails.checkout);
  const baseTotal = nightlyPrice * nights;

  const discountRaw = data.discountPrice;
  const discountAmount = parseDiscount(discountRaw, baseTotal);
  const hasDiscount = discountAmount > 0;

  const finalTotal = baseTotal - discountAmount;

  const priceEl = document.querySelector(".hotel-card-price__price span:last-child");
  if (priceEl) {
    priceEl.textContent = finalTotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const breakdown = document.getElementById("priceBreakdown");
  const subtotalEl = document.getElementById("subtotalPrice");
  const discountEl = document.getElementById("discountValue");
  if (breakdown && subtotalEl && discountEl) {
    if (hasDiscount) {
      breakdown.style.display = "";
      subtotalEl.textContent = baseTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      discountEl.textContent = `- ${discountAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`;
    } else {
      breakdown.style.display = "none";
    }
  }

  const cancelMsgEl = document.querySelector(
    ".hotel-card-installment .your-data__card-subtitle span:first-child"
  );
  if (cancelMsgEl) {
    const ci = new Date(data.userDetails.checkin);
    if (!isNaN(ci)) {
      const dateStr = ci.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      cancelMsgEl.innerHTML = `Cancelamento grátis até <strong>${dateStr}</strong>`;
    } else {
      cancelMsgEl.textContent = "Se você cancelar, terá que pagar";
    }
  }

  const datePriceEl = document.querySelector("#datePrice");
  if (datePriceEl) {
    datePriceEl.textContent = finalTotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  (function updateGuestsInCardTwo() {
    const el = document.getElementById("guestsValue");
    if (!el) return;

    const adults = Number.isFinite(+data.userDetails.adults)
      ? +data.userDetails.adults
      : 0;
    const children = Number.isFinite(+data.userDetails.children)
      ? +data.userDetails.children
      : 0;
    const total = Math.max(0, adults + children);

    const lblHosp = total === 1 ? "hóspede" : "hóspedes";

    el.textContent = `${total} ${lblHosp}`;
  })();
});
