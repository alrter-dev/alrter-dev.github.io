/* Maquette « voyages » de la page Fonctionnalités : l'écran Voyages de l'application, la liste à gauche, la page du voyage
   à droite — en-tête (statut, bateau, mode de navigation, pivots, points, distance), onglets, première ligne de la trace,
   carte avec le parcours et la trace, barre d'actions où l'infobulle du bouton Rapport PDF est ouverte.
   Relevé dans l'application (packages/app/src) :
   - routes/voyages/VoyagesList.tsx : en-tête « Voyages » + bouton Nouveau, « Filtré par bateau », sections Actifs (or #eab308),
     Planifiés (accent), Archivés (gris) ; carte d'un voyage (bord gauche or de 3 px pour l'actif, étoile, archivés à 70 %) ;
   - routes/voyages/VoyageDetail.tsx et voyageDetailUi.tsx : en-tête, Kpi, TabButton, onglet Trace (colonnes 20/10/60/1fr/auto/28),
     barre d'actions (boutons carrés de 36 px bordés de la couleur du texte, ordre étoile · corbeille · archive · rapport PDF ·
     dossier des exports · enregistrer, ce dernier éteint tant que rien n'a changé) ; status.ts (couleurs des statuts) ;
   - components/navMode/navModeItems.ts et VoyageNavModeBadge.tsx : la pastille du mode (Compétiteur, trophée, accent) ;
   - components/NavawayMap/layers/routeLine.ts (parcours : or #C5A572, 3 px, tirets 2-2, opacité 0,85),
     pointsTrace.ts (trace : lime #bef264, 2,5 px, tirets 2-3 ; points automatiques sans contour), lib/pointMethod.ts (GPS #10B981),
     pivots.ts (fanions de départ vert #2ECC71 et d'arrivée rouge #E74C3C), flecheDeMarque.ts (marque bâbord passée : anneau
     rouge et coche), ownShip.ts (le bateau, GPS en marche : pastille violette #9B59B6 bordée de blanc) ;
   - index.css (jetons), i18n/locales/fr|en/voyages.json et common.json (textes) ; icônes lucide-react 0.469 (tracés repris tels quels).
   Données : la scène réelle du Morbihan (scenes.js, essais/n523/site/scene.py) — départ dans le golfe, marque à laisser à bâbord,
   arrivée au Palais ; la trace suit la route calculée de la scène, un point automatique toutes les 10 min (temps lus sur ses
   isochrones, interpolés le long de la route là où l'isochrone simplifiée ne la croise pas) ; 22 points, le bateau au dernier.
   Distance = somme des segments entre pivots (haversine, comme computePlannedDistanceNm) : 24,9 milles. */
(function () {
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function txt(x, y, t, cls, ancre) {
    return '<text x="' + x + '" y="' + y + '"' + (ancre ? ' text-anchor="' + ancre + '"' : "") + ' class="' + cls + '">' + esc(t) + "</text>";
  }
  // icônes lucide (repère 24 × 24) posées en (x, y) à la taille t
  var ICONES = {
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    voilier: '<path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z"/><path d="M21 14 10 2 3 14h18Z"/><path d="M10 2v16"/>',
    trophee: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    pivots: '<circle cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-3.9 3.9"/><circle cx="4.5" cy="12" r="2.5"/><path d="M7 12h10"/><circle cx="19.5" cy="12" r="2.5"/><path d="m13.8 17.7 3.9-3.9"/><circle cx="12" cy="19.5" r="2.5"/>',
    epingle: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    telecharger: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    carre: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    coche: '<path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/>',
    corbeille: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    etoile: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    rapport: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    dossier: '<path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1"/><path d="m21 21-1.9-1.9"/><circle cx="17" cy="17" r="3"/>',
    enregistrer: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>'
  };
  function icone(n, x, y, t, coul, epais, plein) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + (t / 24).toFixed(4) + ')" fill="' + (plein || "none") + '" stroke="' + coul +
      '" stroke-width="' + (epais || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + ICONES[n] + "</g>";
  }
  // largeur d'un texte en JetBrains Mono (chasse fixe 0,6 em) avec son interlettrage
  function large(t, taille, inter) { return t.length * taille * (0.6 + (inter || 0)); }

  // la scène du Morbihan, en pixels de scenes.js ; la trace : un point toutes les 10 min depuis le départ (k = 0 à 22)
  var TRACE = [[462.1, 63.6], [446.8, 63.8], [431.9, 67.1], [420.1, 61.6], [402.4, 73.2], [386.3, 89.4], [367.9, 107.2], [363.4, 126.8],
    [376.9, 141.2], [391, 150.6], [400.8, 165.2], [409.9, 178.8], [419, 192.4], [427.7, 205.1], [436.5, 217.8], [446.1, 229.8],
    [459.9, 226.8], [451.6, 218], [437, 222.8], [422.8, 229], [407.3, 234.3], [391.8, 239.7], [375.8, 246.8]];
  var DEPART = [462.1, 63.6], MARQUE = [454.3, 224], ARRIVEE = [195, 333.6];

  window.MAQUETTES = window.MAQUETTES || {};
  window.MAQUETTES.voyages = function () {
    var S = window.SCENES.morbihan, s = "";
    var style = "<style>" +
      ".mq-voyages{--mqv-danger:#f87171}" +
      ":root[data-theme=\"light\"] .mq-voyages{--mqv-danger:#dc2626}" +
      "@media (prefers-color-scheme: light){:root:not([data-theme=\"dark\"]) .mq-voyages{--mqv-danger:#dc2626}}" +
      ".mq-voyages text{font-family:var(--mono)}" +
      ".mq-voyages-filet{stroke:var(--line-strong);stroke-width:.8}" +
      ".mq-voyages-t-liste{font-size:8.5px;font-weight:700;letter-spacing:.1em;fill:var(--fg)}" +
      ".mq-voyages-compte{font-size:8px;fill:var(--dim)}" +
      ".mq-voyages-bouton{font-size:7.5px;font-weight:700;letter-spacing:.1em;fill:var(--on-accent)}" +
      ".mq-voyages-filtre{font-size:7.5px;letter-spacing:.1em;fill:var(--fg)}" +
      ".mq-voyages-filtre-b{font-size:7.5px;fill:var(--accent)}" +
      ".mq-voyages-section{font-size:8px;font-weight:700;letter-spacing:.1em}" +
      ".mq-voyages-nom{font-size:9.5px;font-weight:700;letter-spacing:.02em;fill:var(--fg)}" +
      ".mq-voyages-sous{font-size:7.5px;fill:var(--fg)}" +
      ".mq-voyages-titre{font-size:12px;font-weight:700;letter-spacing:.02em;fill:var(--fg)}" +
      ".mq-voyages-statut{font-size:7.5px;font-weight:700;letter-spacing:.1em;fill:#eab308}" +
      ".mq-voyages-bateau{font-size:8px;fill:var(--muted)}" +
      ".mq-voyages-mode{font-size:8px;font-weight:600;fill:var(--accent)}" +
      ".mq-voyages-depuis{font-size:8px;fill:var(--dim)}" +
      ".mq-voyages-kpi{font-size:7px;font-weight:700;letter-spacing:.1em;fill:var(--fg)}" +
      ".mq-voyages-kpi-v{font-size:9px;fill:var(--accent)}" +
      ".mq-voyages-onglet{font-size:7.5px;font-weight:700;letter-spacing:.1em;fill:var(--muted)}" +
      ".mq-voyages-onglet.mq-voyages-actif{fill:var(--accent)}" +
      ".mq-voyages-petit{font-size:7.5px;fill:var(--dim)}" +
      ".mq-voyages-methode{font-size:7.5px;letter-spacing:.1em;fill:var(--fg)}" +
      ".mq-voyages-pos{font-size:8px;fill:var(--fg)}" +
      ".mq-voyages-lieu{font-size:8.5px;font-weight:500;fill:var(--dim)}" +
      ".mq-voyages text.mq-voyages-bulle{font:400 8px -apple-system,system-ui,\"Segoe UI\",sans-serif;fill:var(--fg)}" +
      "</style>";

    // ── la liste (VoyagesList.tsx)
    s += '<rect x="0" y="0" width="200" height="375" fill="var(--surface)"/><line x1="200" y1="0" x2="200" y2="375" class="mq-voyages-filet"/>';
    s += icone("route", 12, 9.5, 11, "var(--accent)", 1.75);
    var titreListe = SW.t("VOYAGES", "VOYAGES");
    s += txt(28, 19.5, titreListe, "mq-voyages-t-liste") + txt(28 + large(titreListe, 8.5, .1) + 4, 19.5, "4", "mq-voyages-compte");
    var nouveau = SW.t("NOUVEAU", "NEW"), lb = 17 + large(nouveau, 7.5, .1);
    s += '<rect x="' + (190 - lb) + '" y="8" width="' + lb + '" height="15" rx="3" fill="var(--accent)"/>' +
      icone("plus", 190 - lb + 5, 11.5, 7, "var(--on-accent)", 2.5) + txt(190 - lb + 14, 18.6, nouveau, "mq-voyages-bouton");
    s += '<line x1="0" y1="31" x2="200" y2="31" class="mq-voyages-filet"/>';
    var filtre = SW.t("FILTRÉ PAR BATEAU", "FILTERED BY BOAT");
    s += '<rect x="0" y="31" width="200" height="16" fill="var(--surface-2)"/>' + txt(12, 41.6, filtre, "mq-voyages-filtre") +
      txt(12 + large(filtre, 7.5, .1) + 3, 41.6, "ALIZÉ", "mq-voyages-filtre-b") + '<line x1="0" y1="47" x2="200" y2="47" class="mq-voyages-filet"/>';
    function section(y, nom, coul, n) {
      return icone("chevron", 10, y + 5.5, 7.5, "var(--muted)", 2) + '<text x="24" y="' + (y + 12) + '" class="mq-voyages-section" fill="' + coul + '">' + esc(nom) + "</text>" +
        txt(190, y + 12, String(n), "mq-voyages-compte", "end") + '<line x1="0" y1="' + (y + 18) + '" x2="200" y2="' + (y + 18) + '" class="mq-voyages-filet"/>';
    }
    function carte(y, nom, date, etat) {
      var c = '<g' + (etat === "archive" ? ' opacity=".7"' : "") + ">";
      if (etat === "actif") c += '<rect x="0" y="' + y + '" width="200" height="32" fill="var(--surface-2)"/><rect x="0" y="' + y + '" width="3" height="32" fill="#eab308"/>' +
        icone("etoile", 182, y + 7.5, 7, "#eab308", 2, "#eab308");
      c += txt(12, y + 14, nom, "mq-voyages-nom") + txt(12, y + 25.5, "ALIZÉ · " + date, "mq-voyages-sous");
      return c + '<line x1="0" y1="' + (y + 32) + '" x2="200" y2="' + (y + 32) + '" class="mq-voyages-filet"/></g>';
    }
    s += section(47, SW.t("ACTIFS", "ACTIVE"), "#eab308", 1) + carte(65, SW.t("Morbihan → Belle-Île", "Morbihan → Belle-Île"), SW.t("25 OCT. 26", "25 OCT 26"), "actif");
    s += section(97, SW.t("PLANIFIÉS", "PLANNED"), "var(--accent)", 1) + carte(115, "Lorient → New York", SW.t("21 OCT. 26", "21 OCT 26"), "planifie");
    s += section(147, SW.t("ARCHIVÉS", "ARCHIVED"), "var(--dim)", 2) + carte(165, "Quiberon → Houat", SW.t("14 SEPT. 26", "14 SEP 26"), "archive") +
      carte(197, "Houat → Port-Navalo", SW.t("15 SEPT. 26", "15 SEP 26"), "archive");

    // ── la page du voyage (VoyageDetail.tsx) : en-tête
    s += '<rect x="200.5" y="0" width="399.5" height="375" fill="var(--bg)"/>';
    s += icone("route", 213, 10, 13, "#eab308", 1.75);
    var titre = "Morbihan → Belle-Île", statut = SW.t("ACTIF", "ACTIVE"), xb = 232 + large(titre, 12, .02) + 6, lst = large(statut, 7.5, .1) + 6;
    s += txt(232, 22, titre, "mq-voyages-titre");
    s += '<rect x="' + xb + '" y="13.5" width="' + lst + '" height="11" rx="2" fill="#eab308" fill-opacity=".18"/>' + txt(xb + 3, 21.6, statut, "mq-voyages-statut");
    s += icone("voilier", 232, 28.5, 7, "var(--muted)", 1.75) + txt(242, 34.5, "Alizé", "mq-voyages-bateau");
    var mode = SW.t("Compétiteur", "Racer"), xm = 242 + large(mode, 8);
    s += icone("trophee", 232, 40, 7, "var(--fg)", 2) + txt(242, 46, mode, "mq-voyages-mode") + icone("chevron", xm + 2, 40.5, 7, "var(--dim)", 2) +
      txt(xm + 12, 46, SW.t("depuis le 25 oct. à 18:20", "since 25 Oct, 18:20"), "mq-voyages-depuis");
    // les trois Kpi, alignés à droite (étiquette en capitales, valeur à l'accent)
    var kpis = [[SW.t("PIVOTS", "WAYPOINTS"), "3"], [SW.t("POINTS", "POINTS"), "22"], [SW.t("DISTANCE", "DISTANCE"), "24.9 NM"]], xk = 588;
    for (var i = kpis.length - 1; i >= 0; i--) {
      s += txt(xk, 23.5, kpis[i][0], "mq-voyages-kpi", "end") + txt(xk, 35.5, kpis[i][1], "mq-voyages-kpi-v", "end");
      xk -= Math.max(large(kpis[i][0], 7, .1), large(kpis[i][1], 9)) + 11;
    }
    s += '<line x1="200" y1="54" x2="600" y2="54" class="mq-voyages-filet"/>';
    // les onglets : Route · Trace (ouvert) · Routages
    var onglets = [["pivots", SW.t("ROUTE (3)", "ROUTE (3)")], ["epingle", SW.t("TRACE (22)", "TRACK (22)")], ["route", SW.t("ROUTAGES (1)", "ROUTINGS (1)")]];
    onglets.forEach(function (o, i) {
      var cx = 272 + i * 128, l = 11 + large(o[1], 7.5, .1), x0 = cx - l / 2, actif = i === 1, coul = actif ? "var(--accent)" : "var(--muted)";
      s += icone(o[0], x0, 60.5, 8, coul, 1.75) + txt(x0 + 11, 67.2, o[1], "mq-voyages-onglet" + (actif ? " mq-voyages-actif" : ""));
      if (actif) s += '<rect x="' + (cx - 64) + '" y="72" width="128" height="2" fill="var(--accent)"/>';
    });
    s += '<line x1="200" y1="74" x2="600" y2="74" class="mq-voyages-filet"/>';
    // l'onglet Trace : barre d'outils, compte, première ligne (les plus anciens d'abord)
    function bouton(x, y, t, fond, n, coul, opac) {
      return '<g' + (opac ? ' opacity="' + opac + '"' : "") + '><rect x="' + x + '" y="' + y + '" width="' + t + '" height="' + t + '" rx="3" fill="' + fond +
        '" stroke="var(--fg)" stroke-width=".7"/>' + icone(n, x + (t - t * .46) / 2, y + (t - t * .46) / 2, t * .46, coul, 2) + "</g>";
    }
    s += bouton(213, 80, 18, "var(--surface-2)", "telecharger", "var(--fg)") + bouton(525, 80, 18, "var(--surface-2)", "carre", "var(--fg)") +
      bouton(547, 80, 18, "var(--surface-2)", "coche", "var(--fg)") + bouton(569, 80, 18, "color-mix(in srgb, var(--mqv-danger) 14%, transparent)", "corbeille", "var(--mqv-danger)", ".4");
    s += txt(214, 108.5, SW.t("22 points", "22 points"), "mq-voyages-petit");
    s += '<rect x="213" y="113" width="374" height="17" rx="3" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width=".7"/>' +
      '<rect x="219.5" y="118.5" width="6" height="6" rx="1.2" fill="var(--surface)" stroke="var(--dim)" stroke-width=".7"/>' +
      '<circle cx="234" cy="121.5" r="1.7" fill="#10B981"/>' + txt(240, 124, "GPS", "mq-voyages-methode") +
      txt(270, 124.2, "47°36.31'N · 002°48.03'W", "mq-voyages-pos") + txt(567, 124, SW.t("27 oct. 26 à 09:10", "27 Oct 26, 09:10"), "mq-voyages-petit", "end") +
      '<rect x="571" y="116" width="11" height="11" rx="2" fill="none" stroke="var(--line-strong)" stroke-width=".7"/>' + icone("corbeille", 573.5, 118.5, 6, "var(--dim)", 2);
    s += '<line x1="200" y1="135" x2="600" y2="135" class="mq-voyages-filet"/>';

    // ── la carte du voyage : la scène réduite à 0,62, son bord est collé au bord droit (à l'ouest de la scène : le large)
    var k = 0.62, tx = 600 - 600 * k, ty = 116.6;
    function A(p) { return [+(tx + p[0] * k).toFixed(1), +(ty + p[1] * k).toFixed(1)]; }
    function ligne(pts) { return pts.map(function (p, i) { var a = A(p); return (i ? "L" : "M") + a[0] + " " + a[1]; }).join(""); }
    s += '<clipPath id="mq-voyages-cadre"><rect x="200.5" y="135" width="399.5" height="203"/></clipPath><g clip-path="url(#mq-voyages-cadre)">' +
      '<rect x="200" y="135" width="400" height="203" fill="var(--sea)"/>' +
      '<g transform="translate(' + tx + " " + ty + ") scale(" + k + ')"><path d="' + S.terre.map(MQ.chemin).join("") +
      '" fill="var(--land)" stroke="var(--coast)" stroke-width=".8" vector-effect="non-scaling-stroke"/></g>';
    s += txt(A([166, 112])[0], A([166, 112])[1], "Quiberon", "mq-voyages-lieu", "middle") + txt(A([335, 285])[0], A([335, 285])[1], "Houat", "mq-voyages-lieu", "middle") +
      txt(A([132, 352])[0], A([132, 352])[1], "Belle-Île", "mq-voyages-lieu", "middle");
    // le parcours : traits droits entre les pivots (routeLine.ts)
    s += '<path d="' + ligne([DEPART, MARQUE, ARRIVEE]) + '" fill="none" stroke="#C5A572" stroke-width="2" stroke-opacity=".85" stroke-dasharray="4 4"/>';
    // la trace (pointsTrace.ts) : la ligne, puis les points automatiques GPS
    s += '<path d="' + ligne(TRACE) + '" fill="none" stroke="#bef264" stroke-width="1.7" stroke-opacity=".85" stroke-dasharray="3.4 5.1" stroke-linejoin="round"/>';
    for (var j = 1; j < TRACE.length; j++) { var p = A(TRACE[j]); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="#10B981" fill-opacity=".8"/>'; }
    // la marque bâbord, passée d'après la trace : l'anneau rouge et sa coche (repère de 20 px réduit à 0,55)
    var m = A(MARQUE);
    s += '<g transform="translate(' + (m[0] - 5.5) + " " + (m[1] - 5.5) + ') scale(.55)"><circle cx="10" cy="10" r="7" fill="#FFFFFF" fill-opacity=".85" stroke="#E74C3C" stroke-width="2.5"/>' +
      '<path d="M6.5 10l2.5 2.5l5-5.5" fill="none" stroke="#E74C3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>';
    // les fanions de départ et d'arrivée : la base de la hampe sur le point
    function fanion(p, coul) {
      var a = A(p);
      return '<g transform="translate(' + (a[0] - 16 * .55).toFixed(1) + " " + (a[1] - 30 * .55).toFixed(1) + ') scale(.55)">' +
        '<line x1="16" y1="3" x2="16" y2="30" stroke="#0E1822" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M16 4 L30 11 L16 18 Z" fill="' + coul + '" stroke="#FFFFFF" stroke-width="1"/><circle cx="16" cy="30" r="1.8" fill="#0E1822"/></g>';
    }
    s += fanion(DEPART, "#2ECC71") + fanion(ARRIVEE, "#E74C3C");
    // le bateau au dernier point, cap 245°
    var b = A(TRACE[TRACE.length - 1]);
    s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5.5" fill="#9B59B6" stroke="#fff" stroke-width="1.8"/>' +
      '<path d="M0 -4L3 3.4L0 1.7L-3 3.4Z" transform="translate(' + b[0] + " " + b[1] + ') rotate(245)" fill="#fff"/></g>';

    // ── la barre d'actions, à droite ; l'infobulle (attribut title) du bouton Rapport PDF est ouverte
    s += '<rect x="200.5" y="338" width="399.5" height="37" fill="var(--surface)"/><line x1="200" y1="338" x2="600" y2="338" class="mq-voyages-filet"/>';
    s += bouton(431, 345, 22, "color-mix(in srgb, var(--accent) 14%, transparent)", "etoile", "var(--accent)").replace('fill="none" stroke="var(--accent)"', 'fill="var(--accent)" stroke="var(--accent)"') +
      bouton(458, 345, 22, "color-mix(in srgb, var(--mqv-danger) 14%, transparent)", "corbeille", "var(--mqv-danger)") +
      bouton(485, 345, 22, "var(--surface-2)", "archive", "var(--fg)") + bouton(512, 345, 22, "var(--surface-2)", "rapport", "var(--fg)") +
      bouton(539, 345, 22, "var(--surface-2)", "dossier", "var(--fg)") + bouton(566, 345, 22, "var(--accent)", "enregistrer", "var(--on-accent)", ".4");
    var bulle = SW.t("Générer le rapport PDF du voyage", "Generate the voyage PDF report"), lbu = bulle.length * 4.1 + 12, xbu = Math.min(592 - lbu, 523 - lbu / 2);
    s += '<rect x="' + xbu.toFixed(1) + '" y="321" width="' + lbu.toFixed(1) + '" height="14" rx="3" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width=".7"/>' +
      txt((xbu + 6).toFixed(1), 330.8, bulle, "mq-voyages-bulle");

    return '<svg class="mq-voyages" viewBox="0 0 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + style + s + "</svg>";
  };
})();
