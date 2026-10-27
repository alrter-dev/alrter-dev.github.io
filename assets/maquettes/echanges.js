/* Maquette « echanges » de la page Fonctionnalités : le bouton Routage de la carte, son menu ouvert ; « Router avec
   QtVLM » et « Router avec LuckGrib » y sont deux entrées parmi les sept, la souris sur LuckGrib.

   Données : la scène « corfou » de scenes.js (vraie côte, vraie route du moteur de Sailaware, Marseille → Split), sur
   les couleurs de carte du site comme les maquettes Veille et Météo ; la route est le routage actif, ses isochrones
   masquées (d'où « Afficher les isochrones du routage actif »).

   Formes, couleurs et textes relevés dans l'application (packages/app/src/) :
   - le menu : routes/map/components/RoutageFab.tsx (ordre ORDRE_ROUTAGE.boutonCarte, icônes lucide de
     routes/map/routageEntrees.ts : Radio, Spline, LocateFixed, Ship, ExternalLink, Target, ListChecks, 14 px) ;
     index.css : .map-layer-menu (fond rgba(22,34,46,.97), en Jour rgba(255,255,255,.98) ; bord --color-border-strong ;
     rayon 6 px ; ombre 0 4px 18px rgba(0,0,0,.45) ; ici plein, faute du flou d'arrière-plan qui y efface la carte), .map-layer-menu-item (8 × 12 px, écart 8, 13 px, survol
     rgba(255,255,255,.07)), .map-fabs-vers-le-bas (le menu descend, calé sur le haut du bouton) ;
   - textes : i18n/locales/{fr,en}/map.json, contextMenu.* ;
   - la colonne de boutons : routes/map/components/MapDock.tsx et MapRoute.tsx (ordre : CloudSun, Crosshair, Route,
     Gauge, Circle plein, Bell, Compass, règle de mesure, Ship, Layers), index.css .map-fab (40 px, rayon 6, fond
     rgba(22,34,46,.95) ou blanc .95 en Jour, bord color-mix(--color-text 70 %), icône 16 px) ;
   - la route : components/NavawayMap/layers/routagesLayers.ts (#C0392B, halo blanc .9, départ #2ECC71, arrivée #E74C3C).
   Échelle : 0,8 unité de la maquette par pixel de l'application. */
(function () {
  var K = 0.8;
  // les icônes lucide (dessin 24 × 24, trait de 2)
  var ICONES = {
    radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.1 19.1 19"/><circle cx="12" cy="12" r="2"/>',
    spline: '<circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M5 17A12 12 0 0 1 17 5"/>',
    locateFixed: '<path d="M2 12h3M19 12h3M12 2v3M12 19v3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
    ship: '<path d="M12 10.189V14M12 2v3M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    externalLink: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    listChecks: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    cloudSun: '<path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    crosshair: '<circle cx="12" cy="12" r="10"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    gauge: '<path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0"/>',
    circle: '<circle cx="12" cy="12" r="10" fill="currentColor"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    compass: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
    // la règle de mesure (MapDock.tsx, MeasureRulerIcon) : deux triangles reliés par un pointillé
    regle: '<path d="M5 10L19 22" stroke-width="1.7" stroke-dasharray="2 2"/><path d="M0 1L10 1L5 10ZM14 13L24 13L19 22Z" fill="currentColor" stroke="none"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83zM2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>'
  };
  function icone(nom, cx, cy, px) {
    return '<g transform="translate(' + (cx - px / 2) + " " + (cy - px / 2) + ") scale(" + (px / 24) + ')" class="mq-echanges-ico">' + ICONES[nom] + "</g>";
  }

  window.MAQUETTES.echanges = function () {
    var S = window.SCENES.corfou, MQ = window.MQ, s = "";
    // la carte : côte, noms, la route active (halo blanc puis cœur), départ et arrivée
    s += MQ.cote(S) + MQ.nom("Marseille", 44, 52) + MQ.nom(SW.t("Corse", "Corsica"), 163, 127) +
      MQ.nom(SW.t("Sardaigne", "Sardinia"), 161, 232) + MQ.nom(SW.t("Sicile", "Sicily"), 351, 352);
    var d = "M" + S.route[0] + " " + S.route[1];
    for (var i = 2; i < S.route.length; i += 2) d += "L" + S.route[i] + " " + S.route[i + 1];
    s += '<path d="' + d + '" class="mq-echanges-halo"/><path d="' + d + '" class="mq-echanges-route"/>';
    s += '<circle cx="' + S.dep[0] + '" cy="' + S.dep[1] + '" r="5.6" fill="#2ECC71" class="mq-echanges-wp"/>' +
      '<circle cx="' + S.arr[0] + '" cy="' + S.arr[1] + '" r="5.6" fill="#E74C3C" class="mq-echanges-wp"/>';

    // la colonne de boutons de la carte, à 10 px du bord droit
    var cote = 40 * K, pas = 45 * K, cx0 = 600 - 10 * K - cote, cy0 = 22;
    var colonne = ["cloudSun", "crosshair", "route", "gauge", "circle", "bell", "compass", "regle", "ship", "layers"];
    colonne.forEach(function (nom, k) {
      var y = cy0 + k * pas;
      s += '<rect x="' + cx0 + '" y="' + y + '" width="' + cote + '" height="' + cote + '" rx="' + 6 * K + '" class="mq-echanges-fab"/>' +
        icone(nom, cx0 + cote / 2, y + cote / 2, 16 * K);
    });

    // le menu du bouton Routage : il descend, calé sur le haut du bouton, à sa gauche
    var entrees = [
      ["radio", SW.t("Lancer un routage temps réel", "Start a real-time routing")],
      ["spline", SW.t("Routage du voyage complet", "Route the full voyage")],
      ["locateFixed", SW.t("Routage du voyage résiduel", "Route the remaining voyage")],
      ["ship", SW.t("Router avec QtVLM", "Route with QtVLM")],
      ["externalLink", SW.t("Router avec LuckGrib", "Route with LuckGrib")],
      ["target", SW.t("Afficher les isochrones du routage actif", "Show the active routing's isochrones")],
      ["listChecks", SW.t("Gérer les routages", "Manage routings")]
    ];
    var corps = 13 * K, haut = (13 * 1.5 + 16) * K, plus = 0;
    entrees.forEach(function (e) { plus = Math.max(plus, e[1].length); });
    // largeur : le libellé le plus long (chasse fixe : 0,6 corps par signe), l'icône, l'écart et les marges
    var larg = Math.round(plus * corps * 0.6 + (12 + 14 + 8 + 12) * K + 2);
    var my = cy0 + 2 * pas, mx = cx0 - 20 - larg, mh = entrees.length * haut + 2;
    s += '<g filter="url(#mq-echanges-ombre)"><rect x="' + mx + '" y="' + my + '" width="' + larg + '" height="' + mh + '" rx="' + 6 * K + '" class="mq-echanges-menu"/></g>';
    entrees.forEach(function (e, k) {
      var y = my + 1 + k * haut;
      // la souris est sur « Router avec LuckGrib » : le survol de l'application (invisible en Jour, comme chez elle)
      if (k === 4) s += '<rect x="' + (mx + 1) + '" y="' + y + '" width="' + (larg - 2) + '" height="' + haut + '" class="mq-echanges-survol"/>';
      s += icone(e[0], mx + 12 * K + 7 * K, y + haut / 2, 14 * K) +
        '<text x="' + (mx + (12 + 14 + 8) * K) + '" y="' + (y + haut / 2 + corps * 0.36) + '" class="mq-echanges-item">' + e[1] + "</text>";
    });

    var style = "<style>" +
      ".mq-echanges-halo, .mq-echanges-route { fill: none; stroke-linejoin: round; stroke-linecap: round; }" +
      ".mq-echanges-halo { stroke: #fff; stroke-opacity: .9; stroke-width: 6.5; }" +
      ".mq-echanges-route { stroke: #C0392B; stroke-width: 2.8; }" +
      ".mq-echanges-wp { stroke: #fff; stroke-width: 1.4; }" +
      ".mq-echanges-fab { fill: rgb(22 34 46 / .95); stroke: color-mix(in srgb, var(--fg) 70%, transparent); stroke-width: .75; }" +
      ".mq-echanges-menu { fill: rgb(22 34 46); stroke: rgb(190 242 100 / .22); stroke-width: .75; }" +
      ".mq-echanges-survol { fill: rgb(255 255 255 / .07); }" +
      ".mq-echanges-ico { color: var(--fg); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }" +
      ".mq-echanges-item { font: 400 " + corps + "px var(--mono); fill: var(--fg); }" +
      ":root[data-theme='light'] .mq-echanges-fab { fill: rgb(255 255 255 / .95); }" +
      ":root[data-theme='light'] .mq-echanges-menu { fill: #fff; stroke: rgb(14 24 34 / .18); }" +
      "@media (prefers-color-scheme: light) { :root:not([data-theme='dark']) .mq-echanges-fab { fill: rgb(255 255 255 / .95); }" +
      " :root:not([data-theme='dark']) .mq-echanges-menu { fill: #fff; stroke: rgb(14 24 34 / .18); } }" +
      "</style>";
    var ombre = '<defs><filter id="mq-echanges-ombre" x="-20%" y="-20%" width="140%" height="150%">' +
      '<feDropShadow dx="0" dy="' + 4 * K + '" stdDeviation="' + 9 * K / 2 + '" flood-color="#000" flood-opacity=".45"/></filter></defs>';
    return '<svg viewBox="0 12 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + style + ombre + s + "</svg>";
  };
})();
