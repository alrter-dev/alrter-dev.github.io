/* Commun au site Sailaware : jour / nuit, langue, menu sur téléphone, anciens liens.
   Chargé dans <head> (sans defer) : le thème et la langue sont posés avant que la page se dessine,
   et les scripts des pages peuvent lire SW.lang() dès leur départ.

   La langue reprend le site précédent : choix gardé sous « nw_lang », sinon la langue du navigateur.
   Le français est écrit dans la page ; l'anglais est porté par l'élément lui-même :
     data-en="…"            remplace le contenu (HTML) de l'élément
     data-en-<attribut>="…"  remplace un attribut (aria-label, placeholder, title, content, alt)
   ⚠️ Pas de data-en imbriqués : le contenu du parent écraserait celui de l'enfant.
   Les textes fabriqués par les scripts passent par SW.t(fr, en) et se refont sur l'événement « langue ». */
(function () {
  "use strict";
  var html = document.documentElement;

  // jour / nuit — repris du site précédent (« nw_mode », nuit par défaut)
  var mode = null;
  try { mode = localStorage.getItem("nw_mode"); } catch (e) {}
  html.setAttribute("data-theme", mode === "day" ? "light" : "dark");

  var lang = null;
  try { lang = localStorage.getItem("nw_lang"); } catch (e) {}
  if (lang !== "fr" && lang !== "en") lang = (navigator.language || "fr").toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
  html.setAttribute("lang", lang);

  var ATTRS = ["aria-label", "placeholder", "title", "content", "alt"];
  function appliquer(l) {
    lang = l;
    html.setAttribute("lang", l);
    document.querySelectorAll("[data-en]").forEach(function (el) {
      if (!el.hasAttribute("data-fr")) el.setAttribute("data-fr", el.innerHTML);
      el.innerHTML = l === "en" ? el.getAttribute("data-en") : el.getAttribute("data-fr");
    });
    ATTRS.forEach(function (a) {
      document.querySelectorAll("[data-en-" + a + "]").forEach(function (el) {
        var k = "data-fr-" + a;
        if (!el.hasAttribute(k)) el.setAttribute(k, el.getAttribute(a) || "");
        el.setAttribute(a, l === "en" ? el.getAttribute("data-en-" + a) : el.getAttribute(k));
      });
    });
    document.querySelectorAll(".pill-toggle button[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === l));
    });
    try { localStorage.setItem("nw_lang", l); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langue", { detail: l }));
  }

  window.SW = {
    lang: function () { return lang; },
    t: function (fr, en) { return lang === "en" ? en : fr; },
    // nombres à la française (virgule) ou à l'anglaise (point)
    n: function (x, dec) { var s = Number(x).toFixed(dec || 0); return lang === "en" ? s : s.replace(".", ","); }
  };

  // les liens de l'ancien site (une seule page) mènent aux nouvelles pages
  var ANCIENS = { "#beta": "download.html", "#features": "features.html", "#routing": "routing.html" };
  var p = location.pathname, h = location.hash;
  if ((p === "/" || /\/index\.html$/.test(p)) && ANCIENS[h]) location.replace(ANCIENS[h]);

  document.addEventListener("DOMContentLoaded", function () {
    appliquer(lang);
    document.querySelectorAll(".pill-toggle button[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { appliquer(b.getAttribute("data-lang")); });
    });
    document.querySelectorAll(".theme-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var jour = html.getAttribute("data-theme") !== "light";
        html.setAttribute("data-theme", jour ? "light" : "dark");
        try { localStorage.setItem("nw_mode", jour ? "day" : "night"); } catch (e) {}
        document.dispatchEvent(new CustomEvent("theme"));
      });
    });
    var b = document.getElementById("burger"), m = document.getElementById("menu");
    if (b && m) b.addEventListener("click", function () { var o = m.classList.toggle("ouvert"); b.setAttribute("aria-expanded", o ? "true" : "false"); });
  });
})();
