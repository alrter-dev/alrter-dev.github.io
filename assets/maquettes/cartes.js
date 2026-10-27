/* Maquette « cartes » de la page Fonctionnalités : la fenêtre « Nouvelle zone offline » de l'application (Réglages › Cartes ›
   « Nouvelle zone ») — à gauche la carte où l'on trace le rectangle de la zone, avec la consigne et les bornes en degrés ;
   à droite le nom de la zone, la plage de zooms, les fonds et l'overlay à télécharger, puis Annuler / Créer & télécharger.
   Relevé dans l'application (packages/app/src) :
   - routes/settings/rubriques/OfflineZoneModal.tsx : en-tête en surface-2 (titre en capitales, bouton fermer bordé), grille
     « carte | colonne de 340 px », encart de consigne en haut à gauche (fond bg à 90 %, bornes « S … · W … → N … · E … » en
     toFixed(2)), rectangle tracé (fill #bef264 à 0,18, trait #bef264 de 2 px en tirets 4-2), étiquettes en capitales, champs
     sur fond bg, listes à cases, pied bordé en haut avec Annuler (surface-2) et Créer & télécharger (accent, coche) ;
   - les fonds proposés : BASE_STYLE_IDS (OpenFreeMap Positron, MapTiler Ocean, ESRI Satellite ; le nom trop long est tronqué
     comme la classe « truncate ») et l'overlay seamark ; i18n/locales/fr|en/weather.json (offlineZone) et map.json
     (baseStyleName, overlayName) pour les textes ; index.css pour les jetons ; icônes lucide-react 0.469 (X, Check).
   Données : la côte réelle de la scène « corfou » de scenes.js (Méditerranée occidentale, Mercator, essais/n523/site/
   scene_reelle.py) ; le rectangle est posé sur les bornes affichées (Corse et Sardaigne), recalculées dans le repère de la scène. */
(function () {
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function txt(x, y, t, cls, ancre) {
    return '<text x="' + x + '" y="' + y + '"' + (ancre ? ' text-anchor="' + ancre + '"' : "") + ' class="' + cls + '">' + esc(t) + "</text>";
  }
  // la scène « corfou » : longitudes 4,6° à 21° sur 600 px, Mercator au même pas (cadre 3:2), Marseille (43,75° N) à y = 47
  var R = Math.PI / 180, PAS_Y = 16.4 * R / 1.5;
  function merc(l) { return Math.log(Math.tan(Math.PI / 4 + l * R / 2)); }
  var Y1 = merc(43.75) + 47 / 400 * PAS_Y;
  function scene(lon, lat) { return [(lon - 4.6) / 16.4 * 600, (Y1 - merc(lat)) / PAS_Y * 400]; }
  var ZONE = { s: 38.70, w: 7.60, n: 43.15, e: 10.20 };

  window.MAQUETTES = window.MAQUETTES || {};
  window.MAQUETTES.cartes = function () {
    var S = window.SCENES.corfou, s = "";
    var style = "<style>" +
      ".mq-cartes text{font-family:var(--mono)}" +
      ".mq-cartes-filet{stroke:var(--line-strong);stroke-width:.8}" +
      ".mq-cartes-titre{font-size:9px;font-weight:600;letter-spacing:.1em;fill:var(--fg)}" +
      ".mq-cartes-consigne{font-size:8.5px;font-weight:600;fill:var(--fg)}" +
      ".mq-cartes-bornes{font-size:8px;fill:var(--dim)}" +
      ".mq-cartes-etiq{font-size:8px;letter-spacing:.1em;fill:var(--fg)}" +
      ".mq-cartes-petit{font-size:8px;fill:var(--dim)}" +
      ".mq-cartes-champ{font-size:9px;fill:var(--fg)}" +
      ".mq-cartes-ligne{font-size:8.5px;fill:var(--fg)}" +
      ".mq-cartes-bouton{font-size:8.5px;fill:var(--fg)}" +
      ".mq-cartes-bouton-acc{font-size:8px;font-weight:500;fill:var(--on-accent)}" +
      "</style>";

    // ── l'en-tête de la fenêtre
    s += '<rect x="0" y="0" width="600" height="30" fill="var(--surface-2)"/><line x1="0" y1="30" x2="600" y2="30" class="mq-cartes-filet"/>';
    s += txt(16, 19, SW.t("NOUVELLE ZONE OFFLINE", "NEW OFFLINE ZONE"), "mq-cartes-titre");
    s += '<rect x="571" y="6" width="18" height="18" rx="3" fill="var(--surface)" stroke="var(--line-strong)" stroke-width=".7"/>' +
      '<g transform="translate(575 10) scale(.4167)" fill="none" stroke="var(--muted)" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></g>';

    // ── la carte : la scène réduite à la hauteur de la fenêtre (0,8625), calée en haut à gauche
    var k = 345 / 400, ty = 30;
    function A(p) { return [+(p[0] * k).toFixed(1), +(ty + p[1] * k).toFixed(1)]; }
    s += '<clipPath id="mq-cartes-cadre"><rect x="0" y="30" width="408" height="345"/></clipPath><g clip-path="url(#mq-cartes-cadre)">' +
      '<rect x="0" y="30" width="408" height="345" fill="var(--sea)"/>' +
      '<g transform="translate(0 ' + ty + ") scale(" + k + ')"><path d="' + S.terre.map(MQ.chemin).join("") +
      '" fill="var(--land)" stroke="var(--coast)" stroke-width=".8" vector-effect="non-scaling-stroke"/></g>';
    [[SW.t("Corse", "Corsica"), 162.8, 127], [SW.t("Sardaigne", "Sardinia"), 161, 231.4], [SW.t("Italie", "Italy"), 387.8, 183.3], [SW.t("Sicile", "Sicily"), 351.2, 346.4]].forEach(function (n) {
      var a = A([n[1], n[2]]); s += txt(a[0], a[1], n[0], "mq-lieu", "middle");
    });
    // la zone tracée (couches offline-zone-draw-preview-fill / -line)
    var no = A(scene(ZONE.w, ZONE.n)), se = A(scene(ZONE.e, ZONE.s));
    s += '<rect x="' + no[0] + '" y="' + no[1] + '" width="' + (se[0] - no[0]).toFixed(1) + '" height="' + (se[1] - no[1]).toFixed(1) +
      '" fill="#bef264" fill-opacity=".18" stroke="#bef264" stroke-width="1.7" stroke-dasharray="6.8 3.4"/>';
    // l'encart de consigne, en haut à gauche
    var consigne = SW.t("Maintenez Shift + glisser pour dessiner un rectangle", "Hold Shift + drag to draw a rectangle");
    var bornes = "S " + ZONE.s.toFixed(2) + "° · W " + ZONE.w.toFixed(2) + "° → N " + ZONE.n.toFixed(2) + "° · E " + ZONE.e.toFixed(2) + "°";
    var lc = Math.max(consigne.length * 5.1, bornes.length * 4.8) + 16;
    s += '<rect x="10" y="40" width="' + lc + '" height="31" rx="3" fill="var(--bg)" fill-opacity=".9" stroke="var(--line-strong)" stroke-width=".7"/>' +
      txt(18, 53.5, consigne, "mq-cartes-consigne") + txt(18, 65, bornes, "mq-cartes-bornes") + "</g>";

    // ── la colonne de droite
    s += '<rect x="408" y="30" width="192" height="345" fill="var(--surface)"/><line x1="408" y1="30" x2="408" y2="375" class="mq-cartes-filet"/>';
    function champ(x, y, l, h, t) {
      return '<rect x="' + x + '" y="' + y + '" width="' + l + '" height="' + h + '" rx="3" fill="var(--bg)" stroke="var(--line-strong)" stroke-width=".7"/>' +
        (t ? txt(x + 7, y + h / 2 + 3, t, "mq-cartes-champ") : "");
    }
    function caseACocher(x, y, coche) {
      return coche ? '<rect x="' + x + '" y="' + y + '" width="7" height="7" rx="1.5" fill="var(--accent)"/><path d="M' + (x + 1.6) + " " + (y + 3.6) +
        'l1.5 1.5l2.6-2.9" fill="none" stroke="var(--on-accent)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<rect x="' + x + '" y="' + y + '" width="7" height="7" rx="1.5" fill="var(--surface)" stroke="var(--dim)" stroke-width=".7"/>';
    }
    // une liste à cases (fond bg, bordée) ; un nom trop long est coupé avec « … », comme « truncate »
    function liste(y, lignes) {
      var r = champ(420, y, 168, 4 + lignes.length * 16), place = Math.floor((588 - 6 - 439) / 5.1);
      lignes.forEach(function (l, i) {
        var cy = y + 10 + i * 16, nom = l[0].length > place ? l[0].slice(0, place - 1) + "…" : l[0];
        r += caseACocher(427, cy - 3.5, l[1]) + txt(439, cy + 2.8, nom, "mq-cartes-ligne");
      });
      return r;
    }
    s += txt(420, 50, SW.t("NOM DE LA ZONE", "ZONE NAME"), "mq-cartes-etiq") + champ(420, 55, 168, 20, SW.t("Corse – Sardaigne", "Corsica – Sardinia"));
    s += txt(420, 96, SW.t("PLAGE DE ZOOMS (10..12)", "ZOOM RANGE (10..12)"), "mq-cartes-etiq") +
      txt(420, 108, "Min", "mq-cartes-petit") + txt(508, 108, "Max", "mq-cartes-petit") + champ(420, 112, 80, 18, "10") + champ(508, 112, 80, 18, "12");
    s += txt(420, 152, SW.t("FONDS À INCLURE (2)", "BASE MAPS TO INCLUDE (2)"), "mq-cartes-etiq") +
      liste(157, [["OpenFreeMap Positron", true], [SW.t("MapTiler Ocean (marine + bathymétrie)", "MapTiler Ocean (marine + bathymetry)"), false], ["ESRI Satellite", true]]);
    s += txt(420, 232, SW.t("OVERLAYS À INCLURE (1)", "OVERLAYS TO INCLUDE (1)"), "mq-cartes-etiq") + liste(237, [[SW.t("Signalisation maritime", "Seamarks"), true]]);
    // le pied : Annuler, Créer & télécharger
    var creer = SW.t("Créer & télécharger", "Create & download"), lb = 11 + creer.length * 4.8, xb = 480 + (108 - lb) / 2;
    s += '<line x1="420" y1="333" x2="588" y2="333" class="mq-cartes-filet"/>' +
      '<rect x="420" y="341" width="54" height="20" rx="3" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width=".7"/>' +
      txt(447, 354, SW.t("Annuler", "Cancel"), "mq-cartes-bouton", "middle") +
      '<rect x="480" y="341" width="108" height="20" rx="3" fill="var(--accent)"/>' +
      '<g transform="translate(' + xb.toFixed(1) + ' 347) scale(.3333)" fill="none" stroke="var(--on-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></g>' +
      txt((xb + 11).toFixed(1), 353.8, creer, "mq-cartes-bouton-acc");

    return '<svg class="mq-cartes" viewBox="0 0 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + style + s + "</svg>";
  };
})();
