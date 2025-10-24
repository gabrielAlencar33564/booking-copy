(function () {
  function resolveProjectRoot() {
    try {
      var thisScript =
        document.currentScript ||
        Array.from(document.scripts).find(function (s) {
          return /app\.js(\?|#|$)/i.test(s.src || "");
        });
      var attrRoot = thisScript && thisScript.getAttribute("data-project-root");
      if (attrRoot) {
        return new URL(attrRoot, thisScript.src || location.href).href.replace(
          /([^/])$/,
          "$1/"
        );
      }
      var dir = new URL("./", location.href).href;
      return dir.replace(/([^/])$/, "$1/");
    } catch (e) {
      return (String(location.href).replace(/[^/]+$/, "") || "").replace(
        /([^/])$/,
        "$1/"
      );
    }
  }

  var root = resolveProjectRoot();
  console.log("[file-router] projectRoot:", root);

  window.initFileRouter({
    mode: "iframe",
    mount: "iframe[data-router-view]",
    projectRoot: root,
    home: "pages/home.html",
    enforceHomeOnIndex: true,
    rewriteBaseTag: true,
  });
})();
