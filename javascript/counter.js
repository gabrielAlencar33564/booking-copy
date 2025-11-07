(function () {
  function $(s, el) {
    return (el || document).querySelector(s);
  }

  function initReservationTimer(config = {}) {
    const {
      title,
      totalSeconds,
      bannerSelector = "#reservation-timer-banner",
      titleSelector = ".timer-title",
      hoursSelector = "#hours",
      minutesSelector = "#minutes",
      secondsSelector = "#seconds",
      closeBtnSelector = "#close-timer-btn",
      autoShow = true,
    } = config;

    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      return;
    }
    const finalTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : "Complete sua reserva...";

    const banner = $(bannerSelector);
    if (!banner) return;

    const titleEl = $(titleSelector, banner);
    const hoursEl = $(hoursSelector, banner);
    const minutesEl = $(minutesSelector, banner);
    const secondsEl = $(secondsSelector, banner);
    const closeBtn = $(closeBtnSelector, banner);

    if (titleEl) titleEl.textContent = finalTitle;

    if (banner.dataset.timerIntervalId) {
      clearInterval(Number(banner.dataset.timerIntervalId));
      delete banner.dataset.timerIntervalId;
    }

    const fmt2 = (n) => String(n).padStart(2, "0");
    function paint(h, m, s) {
      if (hoursEl) hoursEl.textContent = fmt2(h);
      if (minutesEl) minutesEl.textContent = fmt2(m);
      if (secondsEl) secondsEl.textContent = fmt2(s);
    }

    const deadlineMs = Date.now() + totalSeconds * 1000;

    if (autoShow) banner.style.display = "block";

    paint(
      Math.floor(totalSeconds / 3600),
      Math.floor((totalSeconds % 3600) / 60),
      Math.floor(totalSeconds % 60)
    );

    const id = setInterval(() => {
      let remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));

      if (remaining <= 0) {
        clearInterval(id);
        paint(0, 0, 0);
        delete banner.dataset.timerIntervalId;
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
            clearInterval(Number(banner.dataset.timerIntervalId));
          } catch (_) {}
          delete banner.dataset.timerIntervalId;
          banner.style.display = "none";
        },
        { once: true }
      );
    }
  }

  window.initReservationTimer = initReservationTimer;
})();
