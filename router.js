/* router.js (com rotas protegidas e compatível file://) */
(function () {
  const view = document.querySelector("[data-router-view]");
  if (!view) throw new Error("Elemento [data-router-view] não encontrado");

  const routes = window.ROUTES || {};
  const HOME_PATH = "/";

  function normalize(path) {
    if (!path) return "/";
    if (!path.startsWith("/")) path = "/" + path;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path;
  }

  function parseHash() {
    const raw = location.hash || "#/";
    const withoutHash = raw.slice(1); // "/your-data?room=x"
    const [pathname, qs] = withoutHash.split("?");
    return { path: normalize(pathname || "/"), search: new URLSearchParams(qs || "") };
  }

  function findRoute(path) {
    // se a rota não existir, forçamos redireção para home
    if (!routes[path]) return null;
    return routes[path];
  }

  // ================= GUARDAS =================

  function hasAllParams(search, names = []) {
    return names.every((k) => {
      const v = search.get(k);
      return v != null && String(v).trim() !== "";
    });
  }

  function hasAllStorage(keys = []) {
    try {
      return keys.every((k) => {
        const v = sessionStorage.getItem(k);
        return v != null && String(v).trim() !== "";
      });
    } catch {
      return false; // sessionStorage pode falhar em file:// em alguns contextos; tratamos como ausente
    }
  }

  function checkRequirements(route, search) {
    const req = route.requires;
    if (!req) return true;

    const okParams = req.params ? hasAllParams(search, req.params) : true;
    const okStorage = req.storage ? hasAllStorage(req.storage) : true;

    // Se você quer que E params E storage sejam obrigatórios, troque para "okParams && okStorage"
    return okParams || okStorage;
  }

  // ===========================================

  function setActiveLink(path) {
    document.querySelectorAll("a[data-route]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const target = href.startsWith("#") ? href.slice(1) : href;
      const targetPath = normalize(target.split("?")[0]);
      const isActive = targetPath === path;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function buildSrc(route, search) {
    const qs = search && [...search].length ? `?${search.toString()}` : "";
    return route.src + qs;
  }

  function navigateTo(path, search) {
    // rota inexistente -> home
    const route = findRoute(path) || routes[HOME_PATH];
    const finalPath = route === findRoute(path) ? path : HOME_PATH;

    // checa guardas (requirements)
    const allowed = checkRequirements(route, search);
    if (!allowed) {
      if (finalPath !== HOME_PATH) {
        // redireciona para home limpando query
        location.hash = "#/";
        return;
      }
      // já está indo para home; segue
    }

    const src = buildSrc(route, search);
    const same = view.getAttribute("src") === src;
    if (!same) view.setAttribute("src", src);

    setActiveLink(finalPath);

    // título
    if (route.title) {
      const base = document.title.split(" · ")[1] || document.title;
      document.title = base ? `${route.title} · ${base}` : route.title;
    }

    // evento
    const ctx = { path: finalPath, search, route };
    const finish = () =>
      window.dispatchEvent(new CustomEvent("routechange", { detail: ctx }));

    if (same) {
      finish();
    } else {
      const onLoad = () => {
        view.removeEventListener("load", onLoad);
        finish();
      };
      view.addEventListener("load", onLoad, { once: true });
    }
  }

  function toHash(path, params) {
    const p = normalize(path || "/");
    const s =
      params instanceof URLSearchParams ? params : new URLSearchParams(params || {});
    return "#" + p + (s.toString() ? `?${s.toString()}` : "");
  }

  function handleHashChange() {
    const { path, search } = parseHash();
    // Se hash é inválido, o navigateTo já manda pra home
    navigateTo(path, search);
  }

  function interceptAnchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const isHash = href.startsWith("#/");
      const isInternalPath = href.startsWith("/") && !href.startsWith("//");
      if (!(isHash || isInternalPath)) return;

      e.preventDefault();
      const out = isHash ? href : "#" + normalize(href);
      if (location.hash === out) {
        handleHashChange();
      } else {
        location.hash = out;
      }
    });
  }

  // API pública
  window.Router = {
    navigate: (path, params) => {
      const out = toHash(path, params);
      if (location.hash === out) handleHashChange();
      else location.hash = out;
    },
    current: () => parseHash(),
    reload: () => handleHashChange(),
  };

  // bootstrap
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("DOMContentLoaded", () => {
    if (!location.hash) location.hash = "#/";
    interceptAnchors();
    handleHashChange();
  });
})();
