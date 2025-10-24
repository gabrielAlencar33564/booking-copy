(function () {
  const $ = (sel, r = document) => r.querySelector(sel);
  const $$ = (sel, r = document) => Array.from(r.querySelectorAll(sel));

  const qs = new URLSearchParams(location.search);

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());
  const onlyDigits = (v) => String(v || "").replace(/\D+/g, "");
  const isFilled = (v) => String(v ?? "").trim().length > 0;

  const requiredBookingKeys = ["checkin", "checkout", "adults", "children", "rooms"];
  const validISO = (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) && s === new Date(s).toISOString().slice(0, 10);

  function ensureElError(el) {
    const container = el.closest(".form-field") || el.parentElement || document.body;
    let err = container.querySelector(".field-error");
    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      err.style.cssText =
        "color:#b91c1c;font-size:.875rem;margin-top:.35rem;line-height:1.2;";
    }

    const hint = container.querySelector("small");

    if (hint) {
      if (err.parentNode !== container || err.nextSibling !== hint) {
        container.insertBefore(err, hint);
      }
    } else {
      if (el.nextSibling !== err) {
        el.insertAdjacentElement("afterend", err);
      }
    }
    return err;
  }

  function setError(el, msg) {
    if (!el) return;
    const wrap = el.closest(".form-field") || el;
    wrap.classList.add("has-error");
    wrap.style.setProperty("--border-color", "#b91c1c");
    el.setAttribute("aria-invalid", "true");
    const err = ensureElError(el);
    err.textContent = msg;
  }

  function clearError(el) {
    if (!el) return;
    const wrap = el.closest(".form-field") || el;
    wrap.classList.remove("has-error");
    wrap.style.removeProperty("--border-color");
    el.removeAttribute("aria-invalid");
    const err = wrap.querySelector(".field-error");
    if (err) err.textContent = "";
  }

  function scrollToFirstError() {
    const first = $(".has-error");
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = first.querySelector("input,select,textarea,button");
      if (input) input.focus({ preventScroll: true });
    }
  }

  function hydrateFromQuery() {
    const map = {
      nome: "nome",
      sobrenome: "sobrenome",
      email: "email",
      pais: "pais",
      phoneCode: "phoneCode",
      phone: "phone",
      order: "order",
      arrivalTime: "arrivalTime",
      loginAndEconomize: "loginAndEconomize",
      confirmation: "confirmation",
      "viagem-trabalho": "viagem-trabalho",
    };
    for (const [fieldId, key] of Object.entries(map)) {
      if (!qs.has(key)) continue;
      const el =
        document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
      if (!el) continue;

      const val = qs.get(key);
      if (el.type === "checkbox") {
        el.checked = val === "1" || String(val).toLowerCase() === "true";
      } else if (el.type === "radio") {
        const radios = $$(`input[name="${el.name}"]`);
        const match = radios.find((r) => r.value === val);
        if (match) match.checked = true;
      } else {
        el.value = val;
      }
    }
  }

  function validateForm() {
    const errors = [];

    const nome = $("#nome");
    const sobrenome = $("#sobrenome");
    const email = $("#email");
    const pais = $("#pais");
    const phoneCode = $("#phoneCode");
    const phone = $("#phone");
    const arrivalTime = $("#arrivalTime");

    [nome, sobrenome, email, pais, phoneCode, phone, arrivalTime].forEach((el) => {
      if (el) clearError(el);
    });

    if (!nome || !isFilled(nome.value)) {
      setError(nome, "Informe seu nome.");
      errors.push(nome);
    }
    if (!sobrenome || !isFilled(sobrenome.value)) {
      setError(sobrenome, "Informe seu sobrenome.");
      errors.push(sobrenome);
    }
    if (!email || !isFilled(email.value) || !isEmail(email.value)) {
      setError(email, "Informe um e-mail válido (ex.: nome@dominio.com).");
      errors.push(email);
    }
    if (!pais || !isFilled(pais.value)) {
      setError(pais, "Selecione seu país/região.");
      errors.push(pais);
    }

    const pc = onlyDigits(phoneCode?.value);
    const ph = onlyDigits(phone?.value);
    if (!phoneCode || pc.length < 1) {
      setError(phoneCode, "Informe o código do país.");
      errors.push(phoneCode);
    }
    if (!phone || ph.length < 8) {
      setError(phone, "Informe um telefone válido (mín. 8 dígitos).");
      errors.push(phone);
    }

    const missingBooking = requiredBookingKeys.filter(
      (k) => !qs.has(k) || !isFilled(qs.get(k))
    );
    const bookingErrors = [];
    if (missingBooking.length) {
      bookingErrors.push(
        "Preencha os dados da reserva (check-in, check-out, hóspedes) antes de prosseguir."
      );
    } else {
      const ci = qs.get("checkin");
      const co = qs.get("checkout");
      if (!validISO(ci)) bookingErrors.push("Check-in inválido (formato YYYY-MM-DD).");
      if (!validISO(co)) bookingErrors.push("Check-out inválido (formato YYYY-MM-DD).");
      if (validISO(ci) && validISO(co) && !(new Date(co) > new Date(ci))) {
        bookingErrors.push("Check-out deve ser posterior ao check-in.");
      }
      const a = +qs.get("adults"),
        c = +qs.get("children"),
        r = +qs.get("rooms");
      if (!(Number.isFinite(a) && a >= 1))
        bookingErrors.push("Quantidade de adultos deve ser ≥ 1.");
      if (!(Number.isFinite(c) && c >= 0))
        bookingErrors.push("Quantidade de crianças deve ser ≥ 0.");
      if (!(Number.isFinite(r) && r >= 1))
        bookingErrors.push("Quantidade de quartos deve ser ≥ 1.");
    }

    if (bookingErrors.length) {
      alert("Verifique os dados da sua reserva:\n\n" + bookingErrors.join("\n"));
      errors.push(email || nome);
    }

    return { ok: errors.length === 0, firstError: errors[0] || null };
  }

  function buildNextUrl(baseUrl) {
    const next = new URL(baseUrl, location.href);
    const nextParams = new URLSearchParams(qs.toString());

    const form = $(".your-data__card-form");
    if (form) {
      const fd = new FormData(form);

      const loginAndEconomize = $("#loginAndEconomize")?.checked ? "1" : "0";
      const confirmation = $("#confirmation")?.checked ? "1" : "0";
      const workTrip =
        ($$('input[name="viagem-trabalho"]').find((r) => r.checked) || {}).value || "";
      const phoneCode = $("#phoneCode")?.value || "";
      const phone = $("#phone")?.value || "";
      const arrivalTimeVal = fd.get("arrivalTime");

      const map = {
        nome: fd.get("nome"),
        sobrenome: fd.get("sobrenome"),
        email: fd.get("email"),
        pais: fd.get("pais"),
        phoneCode,
        phone,
        order: fd.get("order") || "",
        loginAndEconomize,
        confirmation,
        "viagem-trabalho": workTrip,
      };

      Object.entries(map).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        const val = String(v).trim();
        if (val) nextParams.set(k, val);
        else nextParams.delete(k);
      });

      if (arrivalTimeVal && String(arrivalTimeVal).trim()) {
        nextParams.set("arrivalTime", String(arrivalTimeVal).trim());
      } else {
        nextParams.delete("arrivalTime");
      }
    }

    next.search = nextParams.toString();
    return next.toString();
  }

  function wireUp() {
    hydrateFromQuery();

    ["nome", "sobrenome", "email", "pais", "phoneCode", "phone", "arrivalTime"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const evt = el.tagName === "SELECT" ? "change" : "input";
        el.addEventListener(evt, () => clearError(el));
      }
    );

    const nextBtn = $("#next-step-button");
    if (!nextBtn) return;

    nextBtn.addEventListener("click", () => {
      const { ok, firstError } = validateForm();
      if (!ok) {
        if (firstError) scrollToFirstError();
        return;
      }
      const target = nextBtn.getAttribute("data-next-url");
      const url = buildNextUrl(target);
      window.open(url);
    });

    const form = $(".your-data__card-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        nextBtn?.click();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", wireUp);
})();
