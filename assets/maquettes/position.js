/* Maquette « position » de la page Fonctionnalités : l'atlas du ciel Starpath, sur la Grande Ourse, comme l'application
   le dessine dans une fenêtre de 800 × 500 px (viewBox 16:10, un pixel de l'application par unité).
   Relevé dans le code de l'application (packages/app/src) :
   · mise en page, contrôles, pastilles et panneau : routes/starpath/StarpathRoute.tsx, règles .sp-* de index.css
     (colonne de droite 340 px, ciel « toujours sombre » en dégradé #0a1628 → #040812 → #020406) ;
   · le ciel : routes/starpath/StarpathCanvas.tsx — liaisons en pointillés 4/3 rgba(190,242,100,.5), étoile de rayon
     max(2, 8 − 1,2 × magnitude), halo de trois rayons, cœur #BEF264 pour une étoile de navigation, blanc sinon,
     nom pour une magnitude < 2,5 ; boutons + − ↺ ↻ × de 32 px en bas à droite ;
   · la projection : packages/db/src/starpath/projection.ts (computeProjection, projectBase, applyTransform : marge de
     20 % en ascension droite et en déclinaison, 60 px de bord, axes inversés en hémisphère nord), puis zoom 125 % et
     rotation −30°, deux états réels de la vue (un appui sur +, deux sur ↺) ;
   · les étoiles, les liaisons et les textes de la Grande Ourse : lib/starpath/data/constellations.json (clé ursamajor) ;
   · les libellés : i18n/locales/fr|en/position.json (starpath.*) et common.json (ecrans.starpath) ;
   · l'en-tête d'écran (icône Star de lucide à l'accent, titre en capitales, ×) : layout/EnteteEcran.tsx.
   Omis pour garder de l'air : la section « Description » du panneau et la ligne d'aide du bas du ciel. */
(function () {
  // la Grande Ourse des données de l'application : [nom, ascension droite °, déclinaison °, magnitude, navigation]
  var ETOILES = {
    "50801": ["Talitha (ι UMa)", 155.58225241, 41.49951638, 3.06, false],
    "54061": ["Dubhe (α UMa)", 165.93195289, 61.7510332, 1.81, true],
    "44127": ["θ UMa", 134.80189115, 48.04182648, 3.12, false],
    "41704": ["Muscida (ο UMa)", 127.56612488, 60.71816926, 3.35, false],
    "67301": ["Alkaid (η UMa)", 206.88515682, 49.31326506, 1.85, true],
    "50372": ["κ UMa", 154.27413109, 42.91436491, 3.45, false],
    "48319": ["υ UMa", 147.74732428, 59.03873553, 3.78, false],
    "53910": ["Merak (β UMa)", 165.46031999, 56.38242679, 2.34, false],
    "57399": ["Tania Australis (μ UMa)", 176.51255835, 47.77940596, 3.69, false],
    "65378": ["Mizar (ζ UMa)", 200.9814288, 54.92536175, 2.23, false],
    "44471": ["Al Haud (υ UMa)", 135.90636137, 47.15652471, 3.57, false],
    "58001": ["Phecda (γ UMa)", 178.45769772, 53.69476009, 2.41, false],
    "62956": ["Alioth (ε UMa)", 193.50728928, 55.95982116, 1.76, true],
    "46733": ["23 UMa", 142.88211727, 63.06186073, 3.65, false],
    "59774": ["Megrez (δ UMa)", 183.85650051, 57.0326169, 3.32, false],
    "55219": ["Tania Borealis (λ UMa)", 169.61973665, 33.09430567, 3.49, false],
    "46853": ["φ UMa", 143.21430963, 51.67730027, 3.17, false]
  };
  var LIAISONS = [
    ["67301", "65378", "62956", "59774", "58001", "57399", "55219"],
    ["57399", "50801", "50372"],
    ["59774", "54061", "53910", "58001"],
    ["54061", "46733", "41704", "48319", "53910"],
    ["46733", "48319", "46853", "44127", "44471"]
  ];

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  // retour à la ligne au mot, pour la police à chasse fixe de l'application (JetBrains Mono : 0,6 em par signe)
  function lignes(t, max) {
    var mots = t.split(" "), out = [], cur = "";
    for (var i = 0; i < mots.length; i++) {
      var essai = cur ? cur + " " + mots[i] : mots[i];
      if (essai.length > max && cur) { out.push(cur); cur = mots[i]; } else cur = essai;
    }
    if (cur) out.push(cur);
    return out;
  }
  function bloc(t, x, y, max, pas, cls) {
    var l = lignes(t, max), s = '<text x="' + x + '" y="' + y + '" class="' + cls + '">';
    for (var i = 0; i < l.length; i++) s += '<tspan x="' + x + '"' + (i ? ' dy="' + pas + '"' : "") + ">" + esc(l[i]) + "</tspan>";
    return { svg: s + "</text>", n: l.length };
  }
  // un tirage fixe pour les étoiles du fond (l'application en tire 150 au hasard sur tout le ciel)
  function hasard(graine) {
    return function () {
      graine = (graine + 0x6D2B79F5) | 0;
      var t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // le ciel : x, y, largeur, hauteur dans la fenêtre (colonne de gauche, sous les pastilles)
  var CX = 16, CY = 157, CW = 428, CH = 327, ZOOM = 1.25, ROT = -30;

  function ciel() {
    // projection de l'application (projection.ts), hémisphère nord, transformation identité
    var ras = [], decs = [], k;
    for (k in ETOILES) { ras.push(ETOILES[k][1]); decs.push(ETOILES[k][2]); }
    var raMin = Math.min.apply(null, ras), raMax = Math.max.apply(null, ras);
    var decMin = Math.min.apply(null, decs), decMax = Math.max.apply(null, decs);
    var raPad = Math.max(3, (raMax - raMin) * 0.2), decPad = Math.max(3, (decMax - decMin) * 0.2);
    raMin -= raPad; raMax += raPad; decMin -= decPad; decMax += decPad;
    // puis la vue de l'utilisateur (applyTransform) : un appui sur + (zoom × 1,25) et deux sur ↺ (−15° chacun),
    // autour du centre du ciel ; à 100 % et 0°, sur un ciel de cette taille, les noms de Mizar et d'Alioth se chevauchent
    var P = {}, cos = Math.cos(ROT * Math.PI / 180), sin = Math.sin(ROT * Math.PI / 180), mx = CX + CW / 2, my = CY + CH / 2;
    for (k in ETOILES) {
      var nx = 1 - (ETOILES[k][1] - raMin) / (raMax - raMin), ny = 1 - (ETOILES[k][2] - decMin) / (decMax - decMin);
      var dx = CX + 60 + nx * (CW - 120) - mx, dy = CY + 60 + ny * (CH - 120) - my;
      P[k] = [mx + (dx * cos - dy * sin) * ZOOM, my + (dx * sin + dy * cos) * ZOOM];
    }
    var s = '<rect x="' + CX + '" y="' + CY + '" width="' + CW + '" height="' + CH + '" rx="6" fill="url(#mq-position-nuit)" class="mq-position-bord"/>';
    // le fond étoilé discret
    var r = hasard(11);
    for (var i = 0; i < 58; i++) {
      s += '<circle cx="' + (CX + r() * CW).toFixed(1) + '" cy="' + (CY + r() * CH).toFixed(1) + '" r="' + (0.3 + r() * 1.1).toFixed(2) +
        '" fill="#fff" fill-opacity="' + (0.1 + r() * 0.35).toFixed(2) + '"/>';
    }
    // les liaisons
    LIAISONS.forEach(function (l) {
      var d = "";
      l.forEach(function (id, j) { d += (j ? "L" : "M") + P[id][0].toFixed(1) + " " + P[id][1].toFixed(1); });
      s += '<path d="' + d + '" class="mq-position-liaison" stroke-width="' + 1.2 * Math.min(2, Math.max(0.6, ZOOM)) + '"/>';
    });
    // les étoiles : halo, cœur, nom des plus brillantes
    var noms = "";
    for (k in ETOILES) {
      var e = ETOILES[k], x = P[k][0], y = P[k][1], ray = Math.max(2, 8 - e[3] * 1.2) * Math.min(2.5, Math.max(0.7, ZOOM));
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (ray * 3).toFixed(1) + '" fill="url(#mq-position-halo' + (e[4] ? "-nav" : "") + ')"/>' +
        '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + ray.toFixed(2) + '" fill="' + (e[4] ? "#BEF264" : "#FFFFFF") + '"/>';
      if (e[3] < 2.5) noms += '<text x="' + (x + ray + 5).toFixed(1) + '" y="' + (y + 3).toFixed(1) + '" class="mq-position-nom" font-size="' + (10 * Math.min(1.8, ZOOM)).toFixed(0) + '">' + esc(e[0].split(" (")[0]) + "</text>";
    }
    s += noms;
    // les boutons flottants du ciel
    var b = ["+", "−", "↺", "↻", "×"];
    for (var j = 0; j < b.length; j++) {
      var bx = CX + CW - 10 - 16, by = CY + CH - 10 - 16 - (b.length - 1 - j) * 37;
      s += '<circle cx="' + bx + '" cy="' + by + '" r="15.5" class="mq-position-bouton' + (j === 4 ? " mq-position-raz" : "") + '"/>' +
        '<text x="' + bx + '" y="' + (by + (j === 4 ? 3.5 : 5)) + '" text-anchor="middle" class="mq-position-btxt' + (j === 4 ? " mq-position-razt" : "") + '">' + b[j] + "</text>";
    }
    return s;
  }

  function pastille(x, t) {
    var w = t.length * 6 + 22;
    return { svg: '<rect x="' + x + '" y="123" width="' + w + '" height="22" rx="11" class="mq-position-pastille"/>' +
      '<text x="' + (x + 11) + '" y="137.5" class="mq-position-ptxt">' + esc(t) + "</text>", w: w };
  }

  window.MAQUETTES = window.MAQUETTES || {};
  window.MAQUETTES.position = function () {
    var en = SW.lang() === "en";
    var nom = en ? "Ursa Major" : "Grande Ourse";
    var s = "";
    // l'en-tête d'écran
    s += '<rect x="0" y="0" width="800" height="48" class="mq-position-surface"/><line x1="0" y1="47.5" x2="800" y2="47.5" class="mq-position-filet"/>';
    s += '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" transform="translate(16 16) scale(.6667)" class="mq-position-icone"/>';
    s += '<text x="42" y="28.5" class="mq-position-titre">' + SW.t("Starpath — Atlas du ciel", "Starpath — Sky Atlas") + "</text>";
    s += '<path d="M18 6 6 18M6 6l12 12" transform="translate(763 17) scale(.5833)" class="mq-position-x"/>';

    // colonne de gauche : constellation et hémisphère
    // la boîte des hémisphères prend la largeur de ses deux boutons (11 px, 10 px de bord) ; le champ, le reste
    var nord = SW.t("Nord ↑", "North ↑"), sud = SW.t("Sud ↓", "South ↓");
    var wN = nord.length * 6.6 + 20, wS = sud.length * 6.6 + 20, wH = wN + 10 + wS + 26, xH = 444 - wH, wC = xH - 12 - 16;
    s += '<text x="16" y="71" class="mq-position-label">Constellation</text>';
    s += '<rect x="16.5" y="78.5" width="' + (wC - 1) + '" height="32" rx="6" class="mq-position-champ"/>';
    s += '<text x="27" y="98.5" class="mq-position-valeur">' + (en ? "Ursa Major" : "Grande Ourse (Ursa Major)") + "</text>";
    s += '<path d="M' + (wC + 2) + " 91.5l3-3l3 3M" + (wC + 2) + ' 97.5l3 3l3-3" class="mq-position-chevron"/>';
    s += '<text x="' + xH + '" y="67" class="mq-position-label">' + SW.t("Hémisphère", "Hemisphere") + "</text>";
    s += '<rect x="' + (xH + 0.5) + '" y="74.5" width="' + (wH - 1) + '" height="36" rx="6" class="mq-position-champ"/>';
    s += '<rect x="' + (xH + 13) + '" y="82" width="' + wN + '" height="21" rx="4" class="mq-position-actif"/>';
    s += '<text x="' + (xH + 13 + wN / 2) + '" y="96.5" text-anchor="middle" class="mq-position-hemi mq-position-hemi-on">' + nord + "</text>";
    s += '<text x="' + (xH + 13 + wN + 10 + wS / 2) + '" y="96.5" text-anchor="middle" class="mq-position-hemi">' + sud + "</text>";

    // les pastilles : la constellation, ses étoiles et liaisons, le zoom
    var x = 16, p;
    [nom, SW.t("17 étoiles · 5 liaisons", "17 stars · 5 links"), "Zoom " + Math.round(ZOOM * 100) + "% · Rot " + ROT + "°"].forEach(function (t) {
      p = pastille(x, t); s += p.svg; x += p.w + 6;
    });
    s += ciel();

    // colonne de droite : le panneau d'information
    s += '<rect x="460" y="48" width="340" height="452" class="mq-position-surface"/><line x1="460.5" y1="48" x2="460.5" y2="500" class="mq-position-filet"/>';
    s += '<path d="m12 19-7-7 7-7M19 12H5" transform="translate(476 68) scale(.5)" class="mq-position-retour"/>';
    s += '<text x="494" y="78" class="mq-position-lien">' + SW.t("Retour au relevé astral", "Back to celestial sight") + "</text>";
    s += '<text x="476" y="113" class="mq-position-ptitre">' + nom + "</text>";
    s += '<text x="476" y="131" class="mq-position-latin">Ursa Major</text>';
    // « Repérage en navigation » : le texte des données de l'application, au mot près
    var rep = bloc(SW.t("Le Grand Chariot est l'astérisme le plus connu. Les deux étoiles du bord (Dubhe-Merak) pointent vers la Polaire. Prolongez l'arc de la queue vers Arcturus. Circumpolaire aux latitudes moyennes nord.",
      "The Big Dipper is the best-known asterism. The two stars at its edge (Dubhe-Merak) point toward Polaris. Extend the arc of the handle toward Arcturus. Circumpolar at mid-northern latitudes."), 489, 189, 39, 18, "mq-position-corps");
    var h = 10 + 12 + 6 + rep.n * 18 + 10;
    s += '<rect x="476.5" y="148.5" width="307" height="' + h + '" rx="6" class="mq-position-section"/>';
    s += '<text x="489" y="167" class="mq-position-stitre">' + SW.t("Repérage en navigation", "Navigation reference") + "</text>" + rep.svg;
    // visibilité et période, puis l'étoile principale
    var y = 148 + h + 14;
    var vis = bloc(SW.t("Circumpolaire >40°N", "Circumpolar >40°N"), 486, y + 32, 19, 15, "mq-position-mval");
    var per = bloc(SW.t("Visible toute l'année (hém. nord)", "Visible all year (N. Hemisphere)"), 644, y + 32, 19, 15, "mq-position-mval");
    var hm = 8 + 11 + 3 + Math.max(vis.n, per.n) * 15 + 8;
    s += '<rect x="476.5" y="' + (y + 0.5) + '" width="149" height="' + hm + '" rx="6" class="mq-position-section"/>' +
      '<rect x="634.5" y="' + (y + 0.5) + '" width="149" height="' + hm + '" rx="6" class="mq-position-section"/>';
    s += '<text x="486" y="' + (y + 17) + '" class="mq-position-mlabel">' + SW.t("Visibilité", "Visibility") + "</text>" + vis.svg;
    s += '<text x="644" y="' + (y + 17) + '" class="mq-position-mlabel">' + SW.t("Période", "Period") + "</text>" + per.svg;
    y += hm + 14;
    s += '<rect x="476.5" y="' + (y + 0.5) + '" width="307" height="45" rx="6" class="mq-position-section"/>';
    s += '<text x="486" y="' + (y + 17) + '" class="mq-position-mlabel">' + SW.t("Étoile principale", "Main star") + "</text>";
    s += '<text x="486" y="' + (y + 32) + '" class="mq-position-mval">Alioth (ε UMa) - mag 1.76</text>';

    return '<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" class="mq-position" aria-hidden="true">' +
      "<style>" +
      ".mq-position text{font-family:var(--mono)}" +
      ".mq-position-fond{fill:var(--bg)}" +
      ".mq-position-surface{fill:var(--surface)}" +
      ".mq-position-filet{stroke:var(--line)}" +
      ".mq-position-icone{fill:none;stroke:var(--accent);stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}" +
      ".mq-position-x,.mq-position-retour{fill:none;stroke:var(--muted);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
      ".mq-position-retour{stroke:var(--fg)}" +
      ".mq-position-titre{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;fill:var(--fg)}" +
      ".mq-position-label{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;fill:var(--dim)}" +
      ".mq-position-champ{fill:var(--surface-2);stroke:var(--line)}" +
      ".mq-position-valeur{font-size:12px;fill:var(--fg)}" +
      ".mq-position-chevron{fill:none;stroke:var(--muted);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}" +
      ".mq-position-actif{fill:var(--accent);fill-opacity:.22}" +
      ".mq-position-hemi{font-size:11px;font-weight:600;fill:var(--dim)}" +
      ".mq-position-hemi-on{fill:var(--accent)}" +
      ".mq-position-pastille{fill:rgba(10,22,40,.7);stroke:var(--accent);stroke-opacity:.3}" +
      ".mq-position-ptxt{font-size:10px;font-weight:600;fill:var(--accent)}" +
      ".mq-position-bord{stroke:var(--accent);stroke-opacity:.2}" +
      ".mq-position-liaison{fill:none;stroke:rgba(190,242,100,.5);stroke-dasharray:4 3}" +
      ".mq-position-nom{fill:rgba(255,255,255,.75)}" +
      ".mq-position-bouton{fill:rgba(10,22,40,.75);stroke:var(--accent);stroke-opacity:.35}" +
      ".mq-position-raz{stroke-dasharray:3 2}" +
      ".mq-position-btxt{font-size:14px;font-weight:700;fill:var(--accent)}" +
      ".mq-position-razt{font-size:10px;font-weight:600}" +
      ".mq-position-lien{font-size:13px;fill:var(--fg)}" +
      ".mq-position-ptitre{font-size:16px;font-weight:700;fill:var(--fg)}" +
      ".mq-position-latin{font-size:11px;font-style:italic;fill:var(--dim)}" +
      ".mq-position-section{fill:var(--surface-2);stroke:var(--line)}" +
      ".mq-position-stitre{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;fill:var(--accent)}" +
      ".mq-position-corps{font-size:12px;fill:var(--fg)}" +
      ".mq-position-mlabel{font-size:9px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;fill:var(--dim)}" +
      ".mq-position-mval{font-size:11px;fill:var(--fg)}" +
      "</style>" +
      '<defs><radialGradient id="mq-position-nuit" cx=".5" cy=".5" r=".7071"><stop offset="0" stop-color="#0a1628"/><stop offset=".7" stop-color="#040812"/><stop offset="1" stop-color="#020406"/></radialGradient>' +
      '<radialGradient id="mq-position-halo"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mq-position-halo-nav"><stop offset="0" stop-color="rgb(190,242,100)" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="0" y="0" width="800" height="500" class="mq-position-fond"/>' + s + "</svg>";
  };
})();
