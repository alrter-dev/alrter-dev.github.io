/* Maquette « polaires » de la page Fonctionnalités : l'écran Polaires de l'application, onglet Visualiser — le
   diagramme de la polaire (une courbe par force de vent, « Tous les TWS ») et, à côté, le panneau VMG / Angle optimal
   ouvert. Relevé dans le code de l'application (packages/app/src) :
   · routes/polaires/PolaireDiagram.tsx — le diagramme : 0° en haut, miroir bâbord, rayon = STW, un cercle tous les
     2 nœuds (« 2 kts »… à droite de l'axe), axes 0/90/180/270 et rayons 60/120/240/300, la flèche d'accent au sommet
     (son mot « VENT », posé hors du canevas à cette taille, n'y paraît pas), les sept couleurs CURVE_COLORS dans
     l'ordre des TWS, trait de 1,5 à 85 %, la légende « 2 kts … 40 kts » sous le canevas ;
   · routes/polaires/PolaireVisualizerTab.tsx et @navaway/db polaires/grid.ts (computeVmgTable) — le panneau VMG :
     pour chaque TWS, l'angle qui maximise STW × cos(TWA) au près (< 90°) et au portant (> 90°, 180° compris), sur les
     angles de la grille ; valeurs écrites « 48° » et « 1.38 kts » (toFixed(2) : un point, dans les deux langues) ;
   · routes/polaires/PolaireDetail.tsx — l'en-tête (nom, bateau, Exporter, corbeille) et les onglets Visualiser,
     Modifier, Dupliquer (icônes lucide Eye, Edit3, Copy) ;
   · i18n/locales/fr|en/polaires.json — tous les textes ; index.css — les jetons (le site reprend les mêmes).
   La polaire : la vraie « SAILAWAY - C60-ADJ-20260911 » (dernière des trois de ce nom) du décor de l'application
   (packages/db/src/polaires/__decor_polaires_po.json), grille standard 21 × 42 ; on garde les 20 colonnes TWS 2 à 40
   (la colonne 0 est nulle par construction). Affichée sous le nom « C60-ADJ-20260911 », bateau « C60 ».
   Écarts voulus, faute de place dans le cadre 16:10 : le panneau VMG est À CÔTÉ du diagramme (dans l'appli, dessous,
   on fait défiler), la barre « Diagramme · Tous les TWS · Tableau » n'est pas dessinée, la liste des polaires non plus,
   les petits textes du canevas sont un peu grossis. */
(function () {
  var M = window.MAQUETTES = window.MAQUETTES || {};

  // la grille standard (polaires/grid.ts) : TWA 0 puis 20 → 180 par pas de 4 ; TWS 2 → 40 par pas de 2
  var TWA = [0];
  for (var a = 20; a <= 180; a += 4) TWA.push(a);
  var TWS = [];
  for (var t = 2; t <= 40; t += 2) TWS.push(t);
  // V[i][j] : STW (nœuds) pour TWS[i] et TWA[j]
  var V = [
    [0,0.3,0.52,0.76,1.02,1.29,1.57,1.84,2.06,2.2,2.29,2.4,2.56,2.76,2.93,3.01,3.03,3.06,3.12,3.19,3.19,3.15,3.08,3.03,2.98,2.9,2.81,2.7,2.59,2.48,2.4,2.39,2.43,2.49,2.49,2.42,2.3,2.15,1.99,1.84,1.73,1.67],
    [0,0.5,0.87,1.27,1.71,2.16,2.63,3.07,3.43,3.68,3.85,4.03,4.3,4.65,4.94,5.08,5.12,5.17,5.27,5.37,5.4,5.36,5.3,5.24,5.15,5,4.81,4.59,4.36,4.15,4.03,4.03,4.12,4.2,4.2,4.09,3.91,3.67,3.4,3.15,2.96,2.86],
    [0,0.72,1.23,1.81,2.43,3.08,3.75,4.37,4.89,5.28,5.55,5.8,6.18,6.68,7.13,7.35,7.44,7.53,7.66,7.77,7.82,7.81,7.8,7.76,7.65,7.43,7.12,6.75,6.35,6.02,5.86,5.88,6.01,6.1,6.07,5.92,5.69,5.38,5.01,4.64,4.36,4.21],
    [0,0.91,1.57,2.33,3.13,4,4.86,5.67,6.36,6.9,7.3,7.63,8.09,8.73,9.33,9.68,9.87,10.03,10.18,10.27,10.31,10.35,10.39,10.41,10.28,9.99,9.6,9.13,8.56,8.12,7.96,7.99,8.08,8.12,8.05,7.86,7.59,7.21,6.74,6.25,5.88,5.65],
    [0,1.1,1.89,2.82,3.84,4.93,6.04,7.04,7.88,8.56,9.1,9.54,10.07,10.79,11.52,12.07,12.43,12.67,12.79,12.83,12.86,12.91,13,13.04,12.88,12.55,12.22,11.78,11.01,10.48,10.43,10.43,10.35,10.3,10.19,9.96,9.62,9.17,8.6,8.03,7.58,7.24],
    [0,1.27,2.19,3.29,4.52,5.88,7.23,8.4,9.34,10.11,10.8,11.4,11.99,12.7,13.56,14.37,14.95,15.22,15.26,15.23,15.25,15.32,15.39,15.37,15.13,14.77,14.59,14.29,13.36,12.79,12.87,12.82,12.58,12.45,12.33,12.04,11.59,11.05,10.42,9.82,9.29,8.85],
    [0,1.42,2.46,3.71,5.13,6.72,8.28,9.58,10.56,11.39,12.2,12.96,13.61,14.33,15.29,16.32,17.07,17.36,17.33,17.3,17.37,17.43,17.39,17.21,16.85,16.44,16.22,15.94,15.11,14.59,14.62,14.58,14.45,14.41,14.29,13.93,13.37,12.74,12.05,11.34,10.71,10.23],
    [0,1.54,2.68,4.05,5.6,7.33,9.02,10.42,11.46,12.33,13.23,14.1,14.85,15.63,16.61,17.7,18.53,18.89,18.95,19.04,19.21,19.26,19.04,18.65,18.18,17.71,17.36,16.99,16.43,16.05,15.99,16.01,16.09,16.19,16.14,15.81,15.2,14.42,13.54,12.68,12,11.59],
    [0,1.65,2.86,4.32,5.95,7.75,9.53,11.03,12.16,13.07,14.02,15.01,15.92,16.75,17.63,18.56,19.37,19.92,20.25,20.54,20.8,20.8,20.43,19.87,19.34,18.89,18.5,18.13,17.77,17.51,17.43,17.5,17.69,17.9,17.98,17.77,17.17,16.21,15.11,14.12,13.44,13.09],
    [0,1.73,3.01,4.54,6.25,8.14,10.04,11.66,12.86,13.79,14.78,15.93,17.04,17.91,18.57,19.2,19.93,20.72,21.37,21.82,22.05,21.98,21.55,20.96,20.45,20.06,19.73,19.42,19.15,18.97,18.91,18.99,19.21,19.51,19.76,19.71,19.13,18.04,16.79,15.73,15.05,14.71],
    [0,1.8,3.13,4.73,6.55,8.62,10.74,12.52,13.72,14.58,15.55,16.79,18.06,18.99,19.49,19.84,20.46,21.39,22.24,22.71,22.84,22.72,22.35,21.89,21.48,21.18,20.92,20.68,20.47,20.34,20.31,20.4,20.62,20.95,21.27,21.32,20.79,19.72,18.47,17.42,16.74,16.41],
    [0,1.86,3.24,4.91,6.85,9.13,11.51,13.46,14.63,15.34,16.18,17.37,18.67,19.67,20.17,20.44,20.97,21.85,22.69,23.13,23.24,23.16,22.96,22.69,22.44,22.22,22.03,21.85,21.7,21.62,21.64,21.76,21.95,22.2,22.45,22.5,22.09,21.21,20.12,19.15,18.5,18.18],
    [0,1.91,3.33,5.05,7.07,9.49,12.04,14.09,15.25,15.88,16.6,17.63,18.82,19.82,20.44,20.85,21.39,22.15,22.86,23.3,23.48,23.54,23.52,23.43,23.32,23.2,23.06,22.93,22.84,22.82,22.91,23.07,23.24,23.35,23.44,23.48,23.28,22.69,21.8,20.92,20.3,19.99],
    [0,1.95,3.4,5.16,7.19,9.58,12.09,14.14,15.39,16.11,16.84,17.77,18.8,19.74,20.48,21.08,21.7,22.38,23.01,23.47,23.77,23.97,24.09,24.14,24.14,24.09,24.02,23.95,23.91,23.95,24.09,24.3,24.45,24.48,24.48,24.55,24.57,24.25,23.54,22.71,22.11,21.81],
    [0,1.99,3.47,5.24,7.23,9.48,11.79,13.77,15.15,16.12,16.99,17.91,18.85,19.74,20.53,21.25,21.94,22.61,23.21,23.72,24.12,24.42,24.65,24.8,24.88,24.91,24.9,24.89,24.9,24.98,25.14,25.36,25.51,25.54,25.57,25.73,25.9,25.75,25.16,24.41,23.84,23.56],
    [0,2.03,3.53,5.3,7.25,9.35,11.47,13.36,14.88,16.08,17.11,18.08,18.99,19.84,20.64,21.4,22.11,22.79,23.41,23.96,24.43,24.82,25.13,25.37,25.53,25.63,25.69,25.74,25.79,25.89,26.05,26.24,26.39,26.47,26.57,26.79,27,26.95,26.5,25.88,25.41,25.17],
    [0,2.06,3.59,5.37,7.29,9.31,11.32,13.17,14.76,16.1,17.23,18.23,19.13,19.96,20.75,21.5,22.22,22.91,23.55,24.14,24.67,25.13,25.51,25.83,26.07,26.24,26.37,26.47,26.56,26.68,26.82,26.99,27.14,27.28,27.43,27.63,27.81,27.79,27.49,27.07,26.74,26.57],
    [0,2.09,3.64,5.43,7.36,9.36,11.33,13.17,14.79,16.18,17.35,18.35,19.24,20.05,20.81,21.56,22.27,22.96,23.62,24.24,24.82,25.33,25.79,26.17,26.48,26.72,26.9,27.05,27.18,27.31,27.45,27.61,27.77,27.93,28.1,28.27,28.39,28.39,28.23,27.98,27.78,27.67],
    [0,2.11,3.67,5.48,7.41,9.41,11.38,13.22,14.86,16.25,17.43,18.43,19.3,20.09,20.85,21.58,22.29,22.98,23.65,24.29,24.9,25.46,25.96,26.39,26.75,27.03,27.25,27.43,27.58,27.73,27.88,28.04,28.21,28.38,28.55,28.7,28.8,28.81,28.72,28.59,28.46,28.39],
    [0,2.12,3.69,5.5,7.44,9.45,11.42,13.27,14.9,16.3,17.47,18.46,19.33,20.11,20.86,21.58,22.29,22.99,23.66,24.31,24.94,25.51,26.04,26.5,26.88,27.19,27.43,27.62,27.78,27.94,28.1,28.27,28.44,28.61,28.78,28.93,29.02,29.04,28.99,28.9,28.81,28.76]
  ];

  // PolaireDiagram.tsx — CURVE_COLORS, dans l'ordre des TWS non nuls
  var COULEURS = ["#22D3EE", "#86EFAC", "#FCD34D", "#F97316", "#EF4444", "#EC4899", "#A78BFA"];

  // les icônes lucide de l'écran (tracés de lucide-react 0.469, grille 24)
  var ICONES = {
    oeil: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    crayon: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    copie: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    exporter: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
    bas: '<path d="m6 9 6 6 6-6"/>',
    corbeille: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    voilier: '<path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z"/><path d="M21 14 10 2 3 14h18Z"/><path d="M10 2v16"/>',
    droite: '<path d="m9 18 6-6-6-6"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
  };
  function icone(nom, x, y, taille, classe, tourner) {
    return '<g class="mq-polaires-ic ' + classe + '" transform="translate(' + x + " " + y + ")" + (tourner ? " rotate(" + tourner + " " + taille / 2 + " " + taille / 2 + ")" : "") +
      " scale(" + (taille / 24) + ')">' + ICONES[nom] + "</g>";
  }
  function n2(x) { return Math.round(x * 100) / 100; }

  // le diagramme, à la géométrie de PolaireDiagram.tsx : canevas carré de C (unités de la maquette), rayon max
  // = 0,88 × C/2, cercles tous les 2 nœuds jusqu'au multiple de 2 au-dessus de la plus grande STW
  function diagramme(cx, cy, C) {
    var k = C / 400;  // le canevas de l'appli, ici de 400 px, réduit au cadre
    var R = C / 2 * 0.88, max = 0, i, j, s = "";
    for (i = 0; i < V.length; i++) for (j = 0; j < TWA.length; j++) if (V[i][j] > max) max = V[i][j];
    var anneau = Math.max(4, Math.ceil(max / 2) * 2), e = R / anneau;
    for (var r = 2; r <= anneau; r += 2) {
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r * e) + '" class="mq-polaires-grille"/>';
      s += '<text x="' + n2(cx + 5 * k) + '" y="' + n2(cy - r * e + 3 * k) + '" class="mq-polaires-cercle">' + r + " kts</text>";
    }
    var axes = "M" + cx + " " + n2(cy - R) + "V" + n2(cy + R) + "M" + n2(cx - R) + " " + cy + "H" + n2(cx + R);
    [60, 120, 240, 300].forEach(function (d) {
      var b = (d - 90) * Math.PI / 180;
      axes += "M" + cx + " " + cy + "L" + n2(cx + Math.cos(b) * R) + " " + n2(cy + Math.sin(b) * R);
    });
    s += '<path d="' + axes + '" class="mq-polaires-grille"/>';
    [0, 60, 90, 120, 180, 240, 270, 300].forEach(function (d) {
      var b = (d - 90) * Math.PI / 180, rr = R + 14 * k;
      s += '<text x="' + n2(cx + Math.cos(b) * rr) + '" y="' + n2(cy + Math.sin(b) * rr) + '" class="mq-polaires-angle">' + d + "°</text>";
    });
    // la flèche du vent au sommet (couleur d'accent, halo)
    s += '<path d="M' + n2(cx - 6 * k) + " " + n2(cy - R - 24 * k) + "H" + n2(cx + 6 * k) + "L" + cx + " " + n2(cy - R - 12 * k) + 'Z" class="mq-polaires-vent"/>';
    // une courbe par TWS : tribord de 0 à 180°, puis le miroir bâbord, retour au centre
    for (i = 0; i < TWS.length; i++) {
      var pts = [];
      for (j = 0; j < TWA.length; j++) {
        var v = TWA[j] === 0 ? 0 : V[i][j], b2 = (TWA[j] - 90) * Math.PI / 180;
        pts.push([cx + Math.cos(b2) * v * e, cy + Math.sin(b2) * v * e]);
      }
      var d2 = "M" + n2(pts[0][0]) + " " + n2(pts[0][1]);
      for (j = 1; j < pts.length; j++) d2 += "L" + n2(pts[j][0]) + " " + n2(pts[j][1]);
      for (j = pts.length - 2; j >= 1; j--) d2 += "L" + n2(2 * cx - pts[j][0]) + " " + n2(pts[j][1]);
      d2 += "L" + n2(pts[0][0]) + " " + n2(pts[0][1]);
      s += '<path d="' + d2 + '" class="mq-polaires-courbe" stroke="' + COULEURS[i % COULEURS.length] + '"/>';
    }
    return s;
  }

  // la légende sous le canevas : « — 2 kts », en lignes centrées qui passent à la ligne (flex-wrap)
  function legende(x0, largeur, y0) {
    var s = "", lignes = [[]], lg = 0, CH = 4.8, TRAIT = 9, ESP = 4, ECART = 7;
    TWS.forEach(function (t, i) {
      var w = TRAIT + ESP + (t + " kts").length * CH;
      if (lg > 0 && lg + ECART + w > largeur) { lignes.push([]); lg = 0; }
      lignes[lignes.length - 1].push({ t: t, i: i, w: w });
      lg += (lg > 0 ? ECART : 0) + w;
    });
    lignes.forEach(function (l, n) {
      var tot = 0;
      l.forEach(function (e, k) { tot += e.w + (k ? ECART : 0); });
      var x = x0 + (largeur - tot) / 2, y = y0 + n * 14;
      l.forEach(function (e) {
        s += '<rect x="' + n2(x) + '" y="' + (y - 3.6) + '" width="' + TRAIT + '" height="1.5" rx=".75" fill="' + COULEURS[e.i % COULEURS.length] + '"/>' +
          '<text x="' + n2(x + TRAIT + ESP) + '" y="' + y + '" class="mq-polaires-leg">' + e.t + " kts</text>";
        x += e.w + ECART;
      });
    });
    return s;
  }

  // computeVmgTable (polaires/grid.ts), sur les angles de la grille
  function vmg() {
    return TWS.map(function (t, i) {
      var r = { tws: t, upA: null, upV: 0, dnA: null, dnV: 0 };
      for (var j = 0; j < TWA.length; j++) {
        var a = TWA[j], v = V[i][j];
        if (a <= 0 || a > 180 || !(v > 0)) continue;
        var c = Math.cos(a * Math.PI / 180);
        if (a < 90 && v * c > r.upV) { r.upV = v * c; r.upA = a; }
        if (a > 90 && -v * c > r.dnV) { r.dnV = -v * c; r.dnA = a; }
      }
      return r;
    });
  }

  function panneauVmg(x, y, w) {
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="330" rx="5" class="mq-polaires-carte"/>';
    // l'en-tête du panneau (ouvert) : chevron tourné, soleil d'accent, titre, pastille « V2 »
    s += icone("droite", x + 9, y + 7.5, 10, "mq-polaires-ic-muet", 90) + icone("soleil", x + 23, y + 7.5, 10, "mq-polaires-ic-acc");
    var titre = SW.t("VMG / Angle optimal", "VMG / Optimal angle");
    s += '<text x="' + (x + 38) + '" y="' + (y + 15.5) + '" class="mq-polaires-ptitre">' + titre + "</text>";
    var px = x + 38 + titre.length * 5.25 + 6;
    s += '<rect x="' + px + '" y="' + (y + 7) + '" width="17" height="11" rx="5.5" class="mq-polaires-pastille"/><text x="' + (px + 8.5) + '" y="' + (y + 15) + '" class="mq-polaires-v2">V2</text>';
    s += '<path d="M' + (x + .5) + " " + (y + 25) + "H" + (x + w - .5) + "V" + (y + 330) + "H" + (x + .5) + 'Z" class="mq-polaires-fond"/>';
    s += '<line x1="' + x + '" y1="' + (y + 25) + '" x2="' + (x + w) + '" y2="' + (y + 25) + '" class="mq-polaires-filet"/>';
    // le tableau : colonnes à la largeur de leur plus long texte (comme la table auto du navigateur) ; dans ce
    // panneau étroit, les en-têtes « Près — Angle »… passent à la ligne après le tiret, comme dans une colonne étroite
    var tetes = ["TWS", SW.t("Près — Angle", "Upwind — Angle"), SW.t("Près — VMG", "Upwind — VMG"),
      SW.t("Portant — Angle", "Downwind — Angle"), SW.t("Portant — VMG", "Downwind — VMG")].map(function (h) {
      var i = h.indexOf(" — ");
      return i < 0 ? [h] : [h.slice(0, i + 2), h.slice(i + 3)];
    });
    var lignes = vmg().map(function (p) {
      var up = p.upA !== null && p.upV > 0, dn = p.dnA !== null && p.dnV > 0;
      return [p.tws + " kts", up ? p.upA + "°" : "—", up ? p.upV.toFixed(2) + " kts" : "—", dn ? p.dnA + "°" : "—", dn ? p.dnV.toFixed(2) + " kts" : "—"];
    });
    var larg = tetes.map(function (h, c) {
      var m = 0;
      h.forEach(function (morceau) { m = Math.max(m, morceau.length * 4.45); });
      lignes.forEach(function (l) { m = Math.max(m, l[c].length * 4.9); });
      return m;
    });
    var tot = 0; larg.forEach(function (l) { tot += l; });
    var dispo = w - 20, jeu = (dispo - tot) / larg.length, cx = x + 10, xs = [];
    larg.forEach(function (l) { xs.push(cx + 2); cx += l + jeu; });
    var ty = y + 40;
    tetes.forEach(function (h, c) {
      s += h.length === 1 ? '<text x="' + n2(xs[c]) + '" y="' + (ty + 4.5) + '" class="mq-polaires-th">' + h[0] + "</text>"
        : '<text x="' + n2(xs[c]) + '" y="' + ty + '" class="mq-polaires-th">' + h[0] + '<tspan x="' + n2(xs[c]) + '" dy="9">' + h[1] + "</tspan></text>";
    });
    ty += 9;
    s += '<line x1="' + (x + 10) + '" y1="' + (ty + 7) + '" x2="' + (x + w - 10) + '" y2="' + (ty + 7) + '" class="mq-polaires-filet"/>';
    lignes.forEach(function (l, n) {
      var ly = ty + 22 + n * 17;
      if (ly > 400) return;
      l.forEach(function (v, c) { s += '<text x="' + n2(xs[c]) + '" y="' + ly + '" class="mq-polaires-td' + (v === "—" ? " mq-polaires-muet" : "") + '">' + v + "</text>"; });
      s += '<line x1="' + (x + 10) + '" y1="' + (ly + 6.5) + '" x2="' + (x + w - 10) + '" y2="' + (ly + 6.5) + '" class="mq-polaires-filet"/>';
    });
    return s;
  }

  var STYLE = "<style>" +
    ".mq-polaires text{font-family:var(--mono)}" +
    ".mq-polaires-app{fill:var(--bg)}" +
    ".mq-polaires-bande{fill:var(--surface)}" +
    ".mq-polaires-carte{fill:var(--surface);stroke:var(--line)}" +
    ".mq-polaires-fond{fill:var(--bg)}" +
    ".mq-polaires-filet{stroke:var(--line)}" +
    ".mq-polaires-titre{font-size:12px;font-weight:700;fill:var(--fg);letter-spacing:.02em}" +
    ".mq-polaires-bateau{font-size:8px;fill:var(--muted)}" +
    ".mq-polaires-bouton{fill:var(--surface-2);stroke:var(--line-strong)}" +
    ".mq-polaires-btexte{font-size:8px;font-weight:600;fill:var(--fg);letter-spacing:.08em;text-transform:uppercase}" +
    ".mq-polaires-onglet{font-size:8.5px;font-weight:600;fill:var(--muted);letter-spacing:.08em;text-transform:uppercase}" +
    ".mq-polaires-onglet.mq-polaires-actif{fill:var(--accent)}" +
    ".mq-polaires-souligne{fill:var(--accent)}" +
    ".mq-polaires-ic{fill:none;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;stroke:var(--muted)}" +
    ".mq-polaires-ic-acc{stroke:var(--accent)}" +
    ".mq-polaires-ic-dim{stroke:var(--dim)}" +
    ".mq-polaires-grille{fill:none;stroke:var(--line);stroke-width:.5}" +
    ".mq-polaires-cercle{font-size:5.6px;fill:var(--dim)}" +
    ".mq-polaires-angle{font-size:6.5px;fill:var(--dim);text-anchor:middle;dominant-baseline:central}" +
    ".mq-polaires-vent{fill:var(--accent);filter:drop-shadow(0 0 2px var(--accent))}" +
    ".mq-polaires-courbe{fill:none;stroke-width:1.1;stroke-opacity:.85;stroke-linejoin:round}" +
    ".mq-polaires-leg{font-size:8px;fill:var(--muted)}" +
    ".mq-polaires-ptitre{font-size:7.5px;font-weight:700;fill:var(--fg);letter-spacing:.06em;text-transform:uppercase}" +
    ".mq-polaires-pastille{fill:color-mix(in srgb,var(--accent) 18%,transparent)}" +
    ".mq-polaires-v2{font-size:6.5px;font-weight:700;fill:var(--accent);text-anchor:middle}" +
    ".mq-polaires-th{font-size:7px;font-weight:700;fill:var(--fg);letter-spacing:.03em;text-transform:uppercase}" +
    ".mq-polaires-td{font-size:8px;fill:var(--fg);font-variant-numeric:tabular-nums}" +
    ".mq-polaires-muet{fill:var(--dim)}" +
    "</style>";

  M.polaires = function () {
    var s = '<svg class="mq-polaires" viewBox="0 0 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + STYLE;
    s += '<rect x="0" y="0" width="600" height="375" class="mq-polaires-app"/>';
    // l'en-tête de la polaire (PolaireDetail.tsx) : nom, bateau ; Exporter et la corbeille à droite
    s += '<rect x="0" y="0" width="600" height="70" class="mq-polaires-bande"/>';
    s += '<text x="16" y="21" class="mq-polaires-titre">C60-ADJ-20260911</text>';
    s += icone("voilier", 16, 29, 8.5, "mq-polaires-ic-dim") + '<text x="29" y="36" class="mq-polaires-bateau">C60</text>';
    var exp = SW.t("Exporter", "Export"), we = 34 + exp.length * 5.6;
    s += '<rect x="' + n2(556 - we) + '" y="10" width="' + n2(we) + '" height="22" rx="5" class="mq-polaires-bouton"/>' +
      icone("exporter", n2(563 - we), 16, 10, "") + '<text x="' + n2(576 - we) + '" y="24" class="mq-polaires-btexte">' + exp + "</text>" +
      icone("bas", 544, 16.5, 9, "");
    s += '<rect x="562" y="10" width="24" height="22" rx="5" class="mq-polaires-bouton"/>' + icone("corbeille", 568.5, 15.5, 11, "mq-polaires-ic-dim");
    // les onglets (Visualiser actif, souligné d'accent)
    s += '<line x1="0" y1="70" x2="600" y2="70" class="mq-polaires-filet"/>';
    var x = 16;
    [["oeil", SW.t("Visualiser", "Visualize")], ["crayon", SW.t("Modifier", "Edit")], ["copie", SW.t("Dupliquer", "Duplicate")]].forEach(function (o, i) {
      var w = 14 + o[1].length * 5.8;
      s += icone(o[0], x, 52, 10, i === 0 ? "mq-polaires-ic-acc" : "") + '<text x="' + (x + 14) + '" y="61" class="mq-polaires-onglet' + (i === 0 ? " mq-polaires-actif" : "") + '">' + o[1] + "</text>";
      if (i === 0) s += '<rect x="' + (x - 6) + '" y="68.5" width="' + n2(w + 12) + '" height="2" class="mq-polaires-souligne"/>';
      x += w + 26;
    });
    // le diagramme, dans sa carte ; la carte continue sous le bord du cadre
    s += '<rect x="14" y="80" width="260" height="330" rx="7" class="mq-polaires-carte"/>';
    s += diagramme(144, 210, 240) + legende(22, 244, 344);
    s += panneauVmg(286, 80, 300);
    return s + "</svg>";
  };
})();
