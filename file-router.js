(function () {
  function isAbs(url) {
    return /^([a-z]+:)?\/\//i.test(url) || /^file:\/\//i.test(url);
  }
  function isHash(h) {
    return typeof h === "string" && (h === "" || h[0] === "#");
  }
  function isSpecial(h) {
    return /^(mailto:|tel:|javascript:)/i.test(h || "");
  }

  function joinFile(root, path) {
    if (!path) return root;
    if (isAbs(path)) return path;

    if (path[0] === "/") {
      var r = (root || "").replace(/\/+$/, "");
      return r + "/" + path.replace(/^\/+/, "");
    }
    try {
      return new URL(path, root).href;
    } catch (e) {
      var base = (root || "").replace(/[^/]+$/, "");
      return base + path;
    }
  }

  function normRoot(r) {
    if (!r) return "";
    if (/^file:\/\//i.test(r)) return r.replace(/([^/])$/, "$1/");
    if (/^[a-z]+:\/\//i.test(r)) return r.replace(/([^/])$/, "$1/");
    var href = String(location.href);
    var base = href.replace(/[^/]+$/, "");
    return joinFile(base, r + (r.endsWith("/") ? "" : "/"));
  }

  function setIframeSrcdocWithBase(iframe, html, baseHref) {
    var hasHead = /<head[^>]*>/i.test(html);
    var baseTag = '<base href="' + baseHref + '">';
    var out;
    if (hasHead) {
      out = html.replace(/<head([^>]*)>/i, function (m, g1) {
        return "<head" + g1 + ">" + baseTag;
      });
    } else {
      out = "<head>" + baseTag + "</head>" + html;
    }
    iframe.srcdoc = out;
  }

  function fetchText(url) {
    return new Promise(function (res, rej) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "text";
      xhr.onload = function () {
        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
          res(xhr.responseText);
        } else {
          rej(new Error("HTTP " + xhr.status + " " + url));
        }
      };
      xhr.onerror = function () {
        rej(new Error("Network error " + url));
      };
      xhr.send();
    });
  }

  function getMount(sel) {
    if (!sel) return null;
    return document.querySelector(sel);
  }

  function createRouter(options) {
    var mode = options.mode === "iframe" ? "iframe" : "location";
    var projectRoot = normRoot(
      options.projectRoot || location.href.replace(/[^/]+$/, "")
    );
    var mountSel = options.mount || "iframe[data-router-view]";
    var home = options.home || "";
    var enforceHomeOnIndex = !!options.enforceHomeOnIndex;
    var rewriteBaseTag = options.rewriteBaseTag !== false;
    var mount = mode === "iframe" ? getMount(mountSel) : null;

    function toAbs(p) {
      return joinFile(projectRoot, p);
    }
    function isExternalAbs(abs) {
      return /^(https?:)?\/\//i.test(abs) && !/^file:\/\//i.test(abs);
    }

    function attachIframeGuards(iframeWin) {
      try {
        if (!iframeWin || !iframeWin.document) return;
        var doc = iframeWin.document;

        function navigateAbsFromIframe(absUrl, opts) {
          navigate(absUrl, opts);
        }
        function toAbsFromIframe(href) {
          return toAbs(href);
        }

        function handleLinkClickIframe(e) {
          var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
          if (!a) return;
          var href = a.getAttribute("href");
          if (!href || isHash(href) || isSpecial(href)) return;
          var abs = toAbsFromIframe(href);
          if (isExternalAbs(abs)) return;
          e.preventDefault();
          navigateAbsFromIframe(abs);
        }

        function handleFormSubmitIframe(e) {
          var form = e.target;
          if (!(form && form.tagName === "FORM")) return;
          var action = form.getAttribute("action") || "";
          if (!action || isSpecial(action)) return;
          var abs = toAbsFromIframe(action);
          if (isExternalAbs(abs)) return;
          e.preventDefault();
          if (form.method && form.method.toLowerCase() === "get") {
            var fd = new iframeWin.FormData(form);
            var usp = new iframeWin.URLSearchParams();
            fd.forEach(function (v, k) {
              usp.append(k, v);
            });
            var urlWithQs = abs + (abs.indexOf("?") >= 0 ? "&" : "?") + String(usp);
            navigateAbsFromIframe(urlWithQs);
          } else {
            navigateAbsFromIframe(abs);
          }
        }

        (function wrapOpen() {
          var origOpen = iframeWin.open;
          iframeWin.open = function (url, target, features) {
            var href = String(url || "");
            if (!href || isHash(href) || isSpecial(href))
              return origOpen.call(iframeWin, url, target, features);
            var abs = toAbsFromIframe(href);
            if (isExternalAbs(abs))
              return origOpen.call(iframeWin, abs, target, features);
            navigateAbsFromIframe(abs);
            return null;
          };
        })();

        (function wrapLocation() {
          var loc = iframeWin.location;
          var assign = loc.assign.bind(loc);
          var replace = loc.replace.bind(loc);
          loc.assign = function (u) {
            var href = String(u || "");
            if (!href || isHash(href) || isSpecial(href)) return assign(u);
            var abs = toAbsFromIframe(href);
            if (isExternalAbs(abs)) return assign(abs);
            navigateAbsFromIframe(abs);
          };
          loc.replace = function (u) {
            var href = String(u || "");
            if (!href || isHash(href) || isSpecial(href)) return replace(u);
            var abs = toAbsFromIframe(href);
            if (isExternalAbs(abs)) return replace(abs);
            navigateAbsFromIframe(abs, { skipPush: true });
          };
        })();

        doc.addEventListener("click", handleLinkClickIframe, true);
        doc.addEventListener("submit", handleFormSubmitIframe, true);
      } catch (err) {
        console.warn("[file-router] falha ao injetar guards no iframe:", err);
      }
    }

    function afterIframeLoadedAttachGuards() {
      if (!mount) return;
      try {
        var w = mount.contentWindow;
        attachIframeGuards(w);
      } catch (e) {
        console.warn("[file-router] não foi possível anexar guards ao iframe:", e);
      }
    }

    function navigate(absUrl, opts) {
      opts = opts || {};
      if (mode === "location") {
        location.href = absUrl;
        return;
      }
      if (!mount) {
        location.href = absUrl;
        return;
      }

      fetchText(absUrl)
        .then(function (html) {
          if (rewriteBaseTag) {
            setIframeSrcdocWithBase(mount, html, absUrl.replace(/[^/]+$/, ""));
          } else {
            mount.src = absUrl;
          }

          var attach = function () {
            afterIframeLoadedAttachGuards();
            mount.removeEventListener("load", attach);
          };
          mount.addEventListener("load", attach);

          try {
            if (!opts.skipPush) {
              history.pushState(
                { abs: absUrl, mode: "iframe" },
                "",
                "#" + encodeURIComponent(absUrl)
              );
            }
          } catch (e) {}
        })
        .catch(function () {
          location.href = absUrl;
        });
    }

    function handleLinkClick(e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || isHash(href) || isSpecial(href)) return;
      var abs = toAbs(href);
      if (isExternalAbs(abs)) return;
      e.preventDefault();
      navigate(abs);
    }

    function handleFormSubmit(e) {
      var form = e.target;
      if (!(form && form.tagName === "FORM")) return;
      var action = form.getAttribute("action") || "";
      if (!action || isSpecial(action)) return;
      var abs = toAbs(action);
      if (isExternalAbs(abs)) return;
      e.preventDefault();
      if (form.method && form.method.toLowerCase() === "get") {
        var fd = new FormData(form);
        var usp = new URLSearchParams();
        fd.forEach(function (v, k) {
          usp.append(k, v);
        });
        var urlWithQs = abs + (abs.indexOf("?") >= 0 ? "&" : "?") + String(usp);
        navigate(urlWithQs);
      } else {
        navigate(abs);
      }
    }

    function handlePop() {
      var st = history.state || {};
      if (mode === "iframe" && st && st.abs) {
        navigate(st.abs, { skipPush: true });
        return;
      }
      var h = String(location.hash || "");
      if (/^#file:/.test(h) || /^#file%3A%2F%2F/i.test(h)) {
        try {
          var dec = decodeURIComponent(h.slice(1));
          if (/^file:\/\//i.test(dec)) {
            navigate(dec, { skipPush: true });
            return;
          }
        } catch (err) {}
      }
    }

    function bootRedirect() {
      if (!enforceHomeOnIndex) return;
      var href = String(location.href);
      if (/(^|\/)index\.html?(\?|#|$)/i.test(href)) {
        if (home) {
          var abs = toAbs(home);
          if (mode === "location") {
            location.replace(abs);
          } else {
            navigate(abs, { skipPush: true });
            try {
              history.replaceState(
                { abs: abs, mode: "iframe" },
                "",
                "#" + encodeURIComponent(abs)
              );
            } catch (e) {}
          }
        }
      } else if (mode === "iframe" && mount && home && !location.hash) {
        var absHome = toAbs(home);
        navigate(absHome, { skipPush: true });
        try {
          history.replaceState(
            { abs: absHome, mode: "iframe" },
            "",
            "#" + encodeURIComponent(absHome)
          );
        } catch (e) {}
      } else if (mode === "iframe" && mount && location.hash) {
        handlePop();
      }

      if (mount) {
        var attach = function () {
          afterIframeLoadedAttachGuards();
        };
        mount.addEventListener("load", attach);
      }

      console.log("[file-router] projectRoot efetivo:", projectRoot);
    }

    function wrapWindowOpen() {
      var origOpen = window.open;
      window.open = function (url, target, features) {
        var href = String(url || "");
        if (!href || isHash(href) || isSpecial(href))
          return origOpen.call(window, url, target, features);
        var abs = toAbs(href);
        if (isExternalAbs(abs)) return origOpen.call(window, abs, target, features);
        if (mode === "location") return origOpen.call(window, abs, target, features);
        navigate(abs);
        return null;
      };
    }

    function wrapLocationMethods() {
      var loc = window.location;
      var assign = loc.assign.bind(loc);
      var replace = loc.replace.bind(loc);
      loc.assign = function (u) {
        var href = String(u || "");
        if (!href || isHash(href) || isSpecial(href)) return assign(u);
        var abs = toAbs(href);
        if (isExternalAbs(abs)) return assign(abs);
        if (mode === "location") return assign(abs);
        navigate(abs);
      };
      loc.replace = function (u) {
        var href = String(u || "");
        if (!href || isHash(href) || isSpecial(href)) return replace(u);
        var abs = toAbs(u);
        if (isExternalAbs(abs)) return replace(abs);
        if (mode === "location") return replace(abs);
        navigate(abs, { skipPush: true });
      };
    }

    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("submit", handleFormSubmit, true);
    window.addEventListener("popstate", handlePop);

    wrapWindowOpen();
    wrapLocationMethods();
    bootRedirect();

    return {
      toAbs: toAbs,
      navigate: navigate,
      mount: mount,
      projectRoot: projectRoot,
      mode: mode,
    };
  }

  window.initFileRouter = function initFileRouter(opts) {
    opts = opts || {};
    if (window.__fileRouterInstance) return window.__fileRouterInstance;
    window.__fileRouterInstance = createRouter(opts);
    return window.__fileRouterInstance;
  };
})();
