/* Maquette « routage » de la page Fonctionnalités : la carte pendant un calcul. L'éventail des isochrones s'ouvre
   front par front, puis la route retenue se trace, avec son départ, son arrivée, le bateau sur la route et le haut de
   son tableau de route.

   Données : la scène « corfou » de scenes.js, un vrai routage du moteur de Sailaware (cas du banc Marseille → Corfou,
   arrivée remontée dans le canal de Split, profil Aperçu, fichier de vent GFS Méditerranée du 10/10/2026 06Z, départ le
   10/10/2026 à 12:00 UTC, arrivée en 91,8 h). Distance : la route dessinée, mesurée en milles (projection de la scène,
   essais/n523/site/scene_reelle.py : Mercator, longitudes 4,6° → 21° E).

   Formes, couleurs et textes relevés dans l'application (packages/app/src/) :
   - fond de carte : OpenFreeMap Positron, le fond par défaut, le même en Jour et en Nuit (mer #C2C8CA, terre #F2F3F0,
     relevées dans components/NavawayMap/layers/routagesLayers.ts) — le seul où les isochrones noires se lisent ;
   - isochrones : components/NavawayMap/layers/navawayLiveIso.ts (trait noir de 1 px, opacité 0,55, jonctions rondes) ;
   - route active : routagesLayers.ts (ROUTE_COLORS[0] #C0392B, halo blanc #FFFFFF opacité 0,9 débordant de 4 px,
     cœur de 2,5 à 3,5 px) ; départ #2ECC71 et arrivée #E74C3C, rayon 7, bord blanc 1,5 (seuls points dessinés en
     « Tracé simple ») ;
   - bateau sur la route : layers/routageBoats.ts (pastille de 22 px à la couleur de la route, bord blanc 1,5, flèche
     blanche « M7 2 L10.5 11.5 L7 9.5 L3.5 11.5 Z » au cap) ;
   - tableau de route : routes/map/components/popovers/DiagnosticWidget.tsx et index.css (.mr-diag-widget, .mr-diag-head
     teinté de #9B59B6, titre #9B59B6 en capitales, icône Stethoscope à la couleur de la route, croix en --color-danger),
     cartouche de DiagnosticContent.tsx ; textes : i18n/locales/{fr,en}/map.json (diagnostic.*) et routages.json
     (preset, presetSub) ; formats : diagnosticModel.ts (« Xj Yh Zmin », « 1155.1 NM ») et routageParams.ts
     (formatDepartMs, JJ/MM/AAAA HH:MM, heure de Paris). */
(function () {
  var MER = "#C2C8CA", TERRE = "#F2F3F0", ROUGE = "#C0392B";

  function trait(l) {
    var d = "M" + l[0] + " " + l[1];
    for (var i = 2; i < l.length; i += 2) d += "L" + l[i] + " " + l[i + 1];
    return d;
  }

  // le haut du tableau de route : bandeau (icône, titre, croix) puis le cartouche, clé grise et valeur
  function tableau(x, y) {
    var l = 262, s = "";
    var lignes = [
      [SW.t("Départ", "Departure"), "10/10/2026 14:00"],
      [SW.t("Arrivée", "Arrival"), "14/10/2026 09:48"],
      [SW.t("Durée", "Duration"), "3j 19h 48min"],
      ["Distance", "1155.1 NM"],
      [SW.t("Profil", "Profile"), SW.t("Aperçu (rapide)", "Overview (quick)")]
    ];
    var h = 31 + lignes.length * 16.5 + 7;
    s += '<g class="mq-routage-tard"><rect x="' + x + '" y="' + y + '" width="' + l + '" height="' + h + '" rx="6" class="mq-routage-fiche"/>';
    s += '<path d="M' + (x + 0.5) + " " + (y + 23) + "V" + (y + 6) + "a5.5 5.5 0 0 1 5.5-5.5h" + (l - 12) + "a5.5 5.5 0 0 1 5.5 5.5V" + (y + 23) + 'Z" class="mq-routage-tete"/>';
    // Stethoscope (lucide), 10 px, à la couleur de la route
    s += '<g transform="translate(' + (x + 9) + " " + (y + 7) + ') scale(.42)" fill="none" stroke="' + ROUGE + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></g>';
    s += '<text x="' + (x + 24) + '" y="' + (y + 15.8) + '" class="mq-routage-titre">' + SW.t("Tableau de route — Marseille → Split", "Route sheet — Marseille → Split") + "</text>";
    s += '<path d="M' + (x + l - 14) + " " + (y + 8.5) + "l5 5m0 -5l-5 5" + '" class="mq-routage-croix"/>';
    lignes.forEach(function (r, i) {
      var ly = y + 42 + i * 16.5;
      s += '<text x="' + (x + 11) + '" y="' + ly + '" class="mq-routage-cle">' + r[0] + '</text><text x="' + (x + 92) + '" y="' + ly + '" class="mq-routage-val">' + r[1] + "</text>";
    });
    return s + "</g>";
  }

  window.MAQUETTES.routage = function () {
    var S = window.SCENES.corfou, n = S.fronts.length, r = S.route, s = "";
    // le fond Positron : la mer, la terre sans liseré
    s += '<rect x="0" y="0" width="600" height="400" fill="' + MER + '"/>';
    s += '<path d="' + S.terre.map(function (p) { return trait(p) + "Z"; }).join("") + '" fill="' + TERRE + '"/>';
    // les noms : pays et îles en capitales espacées, villes en clair, halo blanc (Positron)
    [["Corse", "Corsica", 160, 122, "pays"], ["Sardaigne", "Sardinia", 158, 228, "pays"], ["Sicile", "Sicily", 352, 352, "pays"],
      ["Italie", "Italy", 392, 180, "pays"], ["Croatie", "Croatia", 470, 26, "pays"], ["Marseille", "Marseille", 40, 50, "ville"],
      ["Split", "Split", 466, 71, "ville"]]
      .forEach(function (m) {
        s += '<text x="' + m[2] + '" y="' + m[3] + '" text-anchor="middle" class="mq-routage-' + m[4] + '">' + SW.t(m[0], m[1]) + "</text>";
      });
    // l'éventail : chaque front est un groupe, pour l'ouvrir un à un
    S.fronts.forEach(function (f, i) {
      s += '<path d="' + f.l.map(trait).join("") + '" class="mq-routage-f" style="--i:' + i + '"/>';
    });
    // la route retenue : halo blanc puis cœur rouge ; pathLength pour la tracer d'un trait
    var d = trait(r);
    s += '<path d="' + d + '" pathLength="1" class="mq-routage-halo"/><path d="' + d + '" pathLength="1" class="mq-routage-route"/>';
    // départ et arrivée
    s += '<g class="mq-routage-tard"><circle cx="' + S.dep[0] + '" cy="' + S.dep[1] + '" r="5.6" fill="#2ECC71" class="mq-routage-wp"/>' +
      '<circle cx="' + S.arr[0] + '" cy="' + S.arr[1] + '" r="5.6" fill="#E74C3C" class="mq-routage-wp"/>';
    // le bateau sur la route, en mer Tyrrhénienne, la flèche au cap du trait suivant
    var k = 0;
    for (var j = 0; j < r.length; j += 2) if (r[j] <= 262) k = j;
    var cap = Math.atan2(r[k + 2] - r[k], -(r[k + 3] - r[k + 1])) * 180 / Math.PI;
    s += '<g transform="translate(' + r[k] + " " + r[k + 1] + ')"><circle r="8.6" fill="' + ROUGE + '" stroke="#fff" stroke-width="1.3"/>' +
      '<path d="M7 2L10.5 11.5L7 9.5L3.5 11.5Z" transform="rotate(' + cap.toFixed(0) + ') scale(.7) translate(-7 -7)" fill="#fff" stroke="#fff" stroke-width=".5" stroke-linejoin="round"/></g></g>';
    s += tableau(14, 252);

    var style = "<style>" +
      ".mq-routage-pays { font: 600 8px var(--sans); letter-spacing: .14em; text-transform: uppercase; fill: #8b9094; paint-order: stroke; stroke: #fff; stroke-width: 2.4px; stroke-linejoin: round; }" +
      ".mq-routage-ville { font: 500 9.5px var(--sans); fill: #4a4f53; paint-order: stroke; stroke: #fff; stroke-width: 2.6px; stroke-linejoin: round; }" +
      ".mq-routage-f { fill: none; stroke: #000; stroke-opacity: .55; stroke-width: 1px; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }" +
      ".mq-routage-halo, .mq-routage-route { fill: none; stroke-linejoin: round; stroke-linecap: round; stroke-dasharray: 1; }" +
      ".mq-routage-halo { stroke: #fff; stroke-opacity: .9; stroke-width: 6.5; }" +
      ".mq-routage-route { stroke: " + ROUGE + "; stroke-width: 2.8; }" +
      ".mq-routage-wp { stroke: #fff; stroke-width: 1.4; }" +
      ".mq-routage-fiche { fill: var(--surface); fill-opacity: .97; stroke: rgb(155 89 182 / .5); }" +
      ".mq-routage-tete { fill: color-mix(in srgb, #9B59B6 12%, var(--surface)); }" +
      ".mq-routage-titre { font: 700 8.4px var(--mono); fill: #9B59B6; text-transform: uppercase; letter-spacing: .06em; }" +
      ".mq-routage-croix { fill: none; stroke: #f87171; stroke-width: 1.3; stroke-linecap: round; }" +
      ":root[data-theme='light'] .mq-routage-croix { stroke: #dc2626; }" +
      "@media (prefers-color-scheme: light) { :root:not([data-theme='dark']) .mq-routage-croix { stroke: #dc2626; } }" +
      ".mq-routage-cle { font: 400 9.6px var(--mono); fill: var(--dim); }" +
      ".mq-routage-val { font: 400 9.6px var(--mono); fill: var(--fg); }" +
      // l'animation (posée par MAQUETTES_ANIMATIONS.routage) : sans elle, tout est déjà dessiné
      ".mq-routage-pret .mq-routage-f, .mq-routage-pret .mq-routage-tard { opacity: 0; }" +
      ".mq-routage-pret .mq-routage-halo, .mq-routage-pret .mq-routage-route { stroke-dashoffset: 1; }" +
      ".mq-routage-joue .mq-routage-f { opacity: 1; transition: opacity .2s linear calc(var(--i) * 55ms); }" +
      ".mq-routage-joue .mq-routage-halo, .mq-routage-joue .mq-routage-route { stroke-dashoffset: 0; transition: stroke-dashoffset 1.6s ease-in-out " + (n * 0.055 + 0.3).toFixed(2) + "s; }" +
      ".mq-routage-joue .mq-routage-tard { opacity: 1; transition: opacity .5s ease " + (n * 0.055 + 2).toFixed(2) + "s; }" +
      "</style>";
    return '<svg viewBox="0 12 600 375" preserveAspectRatio="xMidYMid slice" data-anime="routage" aria-hidden="true">' + style + s + "</svg>";
  };

  // l'éventail s'ouvre quand la maquette entre à l'écran, et se rejoue à chaque retour ; rien ne bouge si
  // l'utilisateur a demandé moins d'animations
  window.MAQUETTES_ANIMATIONS.routage = function (svg) {
    if (!window.IntersectionObserver || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    // la maquette ne se cache qu'au premier signe de l'observateur : s'il ne vient jamais, tout reste dessiné
    new IntersectionObserver(function (e) {
      svg.classList.add("mq-routage-pret");
      if (e[0].isIntersecting) { svg.getBoundingClientRect(); svg.classList.add("mq-routage-joue"); }
      else svg.classList.remove("mq-routage-joue");
    }, { threshold: 0.35 }).observe(svg);
  };
})();
