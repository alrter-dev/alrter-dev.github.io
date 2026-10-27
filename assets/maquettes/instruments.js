/* Maquette « instruments » de la page Fonctionnalités : la carte, une disposition de la grille d'instruments en haut à
   gauche, le bateau et sa position projetée à droite. Relevé dans le code de l'application (packages/app/src) :
   · lib/grilleInstruments.ts — les cases de 150 × 60 px séparées de 4 px, à l'échelle 0,85 (ECHELLE_MAX de
     lib/instrumentsGraphiques.ts) ; les formes du magasin : Polaire 3 × 2, Vent 3 × 1, V. BATEAU et V. POLAIRE
     1 × 1, Barre d'efficacité 1 × 2 ; la rangée du haut réservée au bloc bateau & voyage ;
   · routes/map/components/InstrumentsGraphiques.tsx — les dessins : cadran Polaire (repère 240, nord en haut, courbe
     à la TWS du moment orientée par la TWD, cercles tous les 2 nœuds et « 18 nd », traits tous les 10°, chiffres
     0/90/180/270, optimums VMG en magenta, triangle du vent, aiguille citron du cap vrai, anneau de la vitesse
     polaire, point plein de la STW, poignée), lignes de pilote « HDG m » et « TWA » (la ligne du mode encadrée
     d'accent) ; cadran Vent (repère 192, bande colorée par la VMG — analyserVent, seuils 70 et 90 % de
     lib/palettePerformance.ts —, triangles cibles, aiguilles V et A) ; unitaires (icône, intitulé, valeur) ;
   · index.css — couleurs « lagon » des instruments (--c-valeur, --c-intitule), accent, vent apparent, magenta du cap
     à suivre, trois états, barre d'efficacité (dégradé 50 → 100 %, fondus autour de 70 et 90 %), nuit et jour ;
   · i18n/locales/fr|en/map.json et common.json — « V. BATEAU », « V. POLAIRE », « EFFICACITÉ POLAIRE », « NMEA · on » ;
   · components/NavawayMap/layers/ownShip.ts et traitProjection.ts — le bateau (pastille #9B59B6 bordée de blanc), le
     trait projeté (#A855F7, pointillé fin) et ses repères (30 min … 48 h), étiquettes en pastille blanche ; les
     repères trop serrés près du bateau perdent leur étiquette, comme dans l'appli.
   Les valeurs se tiennent : la polaire est la vraie « SAILAWAY - C60-ADJ-20260911 » du décor de l'application
   (packages/db/src/polaires/__decor_polaires_po.json), colonne TWS 14 ; à TWA 120° elle donne 16,22 nœuds (case de la
   grille) ; STW 15,6 ⇒ efficacité 96 % ; vent apparent calculé (55° bâbord) ; cap vrai 028°, déclinaison 4° E ⇒
   HDG m 024° ; TWD = cap + TWA signé (convention de l'appli, cap = twd − twa) = 268°. Entre deux cases de la grille, la courbe et les
   optimums sont lus en ligne droite (l'appli lit une spline : écart d'un degré au plus sur les optimums).
   La carte : la scène « corfou » de scenes.js (mer Ionienne, le bateau près de la route de la scène) ; le trait projeté
   au cap (mode HDG, la ligne encadrée de la Polaire), horizon 12 h (un des choix du menu du bateau), reste en mer. */
(function () {
  var M = window.MAQUETTES = window.MAQUETTES || {};

  // la polaire, colonne TWS 14 (grille standard : TWA 0 puis 20 → 180 par pas de 4)
  var TWA_GRILLE = [0];
  for (var g = 20; g <= 180; g += 4) TWA_GRILLE.push(g);
  var V14 = [0, 1.42, 2.46, 3.71, 5.13, 6.72, 8.28, 9.58, 10.56, 11.39, 12.2, 12.96, 13.61, 14.33, 15.29, 16.32, 17.07, 17.36, 17.33,
    17.3, 17.37, 17.43, 17.39, 17.21, 16.85, 16.44, 16.22, 15.94, 15.11, 14.59, 14.62, 14.58, 14.45, 14.41, 14.29, 13.93, 13.37,
    12.74, 12.05, 11.34, 10.71, 10.23];
  function vPolaire(a) {
    a = Math.abs(a);
    for (var i = 0; i < TWA_GRILLE.length - 1; i++) {
      if (a <= TWA_GRILLE[i + 1]) {
        var f = (a - TWA_GRILLE[i]) / (TWA_GRILLE[i + 1] - TWA_GRILLE[i]);
        return V14[i] + (V14[i + 1] - V14[i]) * f;
      }
    }
    return V14[V14.length - 1];
  }

  // la navigation affichée
  var TWS = 14, TWA = -120, CAP = 28, DECL = 4, STW = 15.6, HORIZON_H = 12;
  var TWD = ((CAP + TWA) % 360 + 360) % 360;                    // capDuTwa : cap = twd − twa
  var VPOL = vPolaire(TWA);                                     // 16,22 (case de la grille)
  var PERF = STW / VPOL * 100;
  var r = Math.PI / 180;
  var AWA = -Math.atan2(TWS * Math.sin(-TWA * r), STW + TWS * Math.cos(TWA * r)) / r;   // −54,6 (bâbord)

  // analyserVent (lib/instrumentsGraphiques.ts) : angles de meilleure VMG et zone de chaque degré
  function analyser() {
    var vmg = [], pres = -1, portant = -1, mp = 0, mq = 0, a;
    for (a = 0; a <= 180; a++) {
      var v = vPolaire(a), vm = v > 0 ? v * Math.cos(a * r) : 0;
      vmg.push(vm);
      if (a <= 90 && vm > mp) { mp = vm; pres = a; }
      if (a >= 90 && -vm > mq) { mq = -vm; portant = a; }
    }
    var zones = vmg.map(function (vm, a2) {
      var p = a2 <= 90, pc = (p ? vm / mp : -vm / mq) * 100, audela = p ? a2 < pres : a2 > portant;
      return pc >= 90 ? "haut" : pc >= 70 ? "moyen" : audela ? "bas" : "neutre";
    });
    return { pres: pres, portant: portant, zones: zones };
  }
  var AN = analyser();

  function n2(x) { return Math.round(x * 100) / 100; }
  function pa(cx, cy, rr, a) { var t = (a - 90) * r; return [n2(cx + rr * Math.cos(t)), n2(cy + rr * Math.sin(t))]; }
  function pts(l) { return l.map(function (p) { return p[0] + "," + p[1]; }).join(" "); }
  function arc(cx, cy, rr, a0, a1) {
    var p = pa(cx, cy, rr, a0), q = pa(cx, cy, rr, a1);
    return "M" + p[0] + " " + p[1] + "A" + rr + " " + rr + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + q[0] + " " + q[1];
  }
  function chiffre(x, dec) { return SW.n(x, dec); }

  // les icônes lucide (lucide-react 0.469, grille 24)
  var ICONES = {
    voilier: '<path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z"/><path d="M21 14 10 2 3 14h18Z"/><path d="M10 2v16"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    vent: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
    jauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'
  };
  function icone(nom, x, y, taille, classe) {
    return '<g class="mq-instruments-ic ' + (classe || "") + '" transform="translate(' + n2(x) + " " + n2(y) + ") scale(" + n2(taille / 24) + ')">' + ICONES[nom] + "</g>";
  }

  // la grille : cases de 150 × 60 à l'échelle 0,85, écart 4 ; 1 em = 10 px × 0,85
  var E = 0.85, EM = 10 * E, LC = 150 * E, HC = 60 * E, EC = 4 * E, X0 = 12, Y0 = 24;
  function caseX(col) { return X0 + col * (LC + EC); }
  function caseY(rang) { return Y0 + rang * (HC + EC); }
  function largeur(l) { return l * LC + (l - 1) * EC; }
  function hauteur(h) { return h * HC + (h - 1) * EC; }
  // une carte d'instrument (.jauge-carte) : surface à 95 %, liseré du texte à 70 %, rayon 8, ombre
  function carte(x, y, w, h, nomIcone) {
    return '<rect x="' + n2(x + .5) + '" y="' + n2(y + .5) + '" width="' + n2(w - 1) + '" height="' + n2(h - 1) + '" rx="8" class="mq-instruments-carte"/>' +
      icone(nomIcone, x + 1 + .45 * EM, y + 1 + .4 * EM, 11 * E, "mq-instruments-ic-int");
  }

  // ── la Polaire 3 × 2 : le cadran à gauche, les deux lignes de pilote à droite
  function polaire() {
    var x = caseX(0), y = caseY(1), w = largeur(2), h = hauteur(3);
    var iw = w - 2 - EM, ih = h - 2 - .7 * EM, D = Math.min(ih, iw - 10.6 * EM);
    var dx = x + 1 + .5 * EM, dy = y + 1 + .4 * EM, k = D / 240;
    var s = carte(x, y, w, h, "radar");
    // le cadran, dans son repère (centre 130, rose 100, courbe 86), cadré sur 10 → 250
    var c = '<g transform="translate(' + n2(dx) + " " + n2(dy) + ") scale(" + n2(k) + ') translate(-10 -10)">';
    c += '<circle cx="130" cy="130" r="100" class="mq-instruments-face"/>';
    var vmax = STW, a;
    for (a = 0; a <= 180; a++) vmax = Math.max(vmax, vPolaire(a));
    var pas = vmax < 6 ? 1 : 2, vEch = Math.max(2 * pas, Math.ceil(vmax / pas) * pas);
    function rayon(vk) { return Math.min(vk, vEch * 1.08) / vEch * 86; }
    for (var cc = pas; cc <= vEch + 1e-9; cc += pas) c += '<circle cx="130" cy="130" r="' + n2(rayon(cc)) + '" class="mq-instruments-cercle"/>';
    c += '<text x="13" y="246" class="mq-instruments-pchiffre">' + vEch + " nd</text>";
    for (a = 0; a < 360; a += 10) {
      var p0 = pa(130, 130, 100, a), p1 = pa(130, 130, a % 30 === 0 ? 92 : 96, a);
      c += '<line x1="' + p0[0] + '" y1="' + p0[1] + '" x2="' + p1[0] + '" y2="' + p1[1] + '" class="mq-instruments-trait"/>';
    }
    [0, 90, 180, 270].forEach(function (d) {
      var p = pa(130, 130, 86, d), anc = d === 90 ? "end" : d === 270 ? "start" : "middle", ddy = d === 0 ? 10 : d === 180 ? -2 : 5;
      c += '<text x="' + p[0] + '" y="' + n2(p[1] + ddy) + '" text-anchor="' + anc + '" class="mq-instruments-pchiffre">' + d + "</text>";
    });
    // la courbe : de −180 à 180 autour de la TWD
    var d2 = "";
    for (a = -180; a <= 180; a++) {
      var q = pa(130, 130, rayon(vPolaire(a)), TWD - a);
      d2 += (d2 ? "L" : "M") + q[0] + " " + q[1];
    }
    c += '<path d="' + d2 + '" class="mq-instruments-courbe"/>';
    [AN.pres, -AN.pres, AN.portant, -AN.portant].forEach(function (o) {
      var b = TWD - o, u = pa(130, 130, 90, b), v = pa(130, 130, 100, b);
      c += '<line x1="' + u[0] + '" y1="' + u[1] + '" x2="' + v[0] + '" y2="' + v[1] + '" class="mq-instruments-optimum"/>';
    });
    function triangle(angle, inverse, classe) {
      var pointe = inverse ? 101 : 119, base = inverse ? 117 : 101;
      return '<polygon points="' + pts([pa(130, 130, pointe, angle), pa(130, 130, base, angle - 7), pa(130, 130, base, angle + 7)]) + '" class="' + classe + '"/>';
    }
    c += triangle(TWD, false, "mq-instruments-ventp");
    var bout = pa(130, 130, rayon(VPOL) + 12, CAP), ppol = pa(130, 130, rayon(VPOL), CAP), pstw = pa(130, 130, rayon(STW), CAP);
    c += '<line x1="130" y1="130" x2="' + bout[0] + '" y2="' + bout[1] + '" class="mq-instruments-reel"/>';
    c += '<circle cx="' + ppol[0] + '" cy="' + ppol[1] + '" r="7" class="mq-instruments-ppol"/>';
    c += '<circle cx="' + pstw[0] + '" cy="' + pstw[1] + '" r="7" class="mq-instruments-pstw"/>';
    c += '<circle cx="130" cy="130" r="6" class="mq-instruments-moyeu"/>';
    c += triangle(CAP, true, "mq-instruments-poignee");
    s += c + "</g>";
    // les lignes de pilote : 5,6 em de haut, 1,2 em d'écart, centrées en hauteur ; la ligne du mode (HDG) encadrée
    var lx = dx + D + .6 * EM, lw = x + 1 + .5 * EM + iw - lx, lh = 5.6 * EM, ly = dy + (ih - 2 * lh - 1.2 * EM) / 2;
    var cap = String(((Math.round(CAP - DECL) % 360) + 360) % 360);
    while (cap.length < 3) cap = "0" + cap;
    [[["HDG ", "m"], cap, "°", true], [["TWA", ""], String(Math.abs(TWA)), "° " + (TWA < 0 ? "B" : "T"), false]].forEach(function (l, i) {
      var yy = ly + i * (lh + 1.2 * EM), cxm = lx + lw / 2;
      s += '<rect x="' + n2(lx + (l[3] ? 1 : .5)) + '" y="' + n2(yy + (l[3] ? 1 : .5)) + '" width="' + n2(lw - (l[3] ? 2 : 1)) + '" height="' + n2(lh - (l[3] ? 2 : 1)) + '" rx="4" class="' + (l[3] ? "mq-instruments-pilote-actif" : "mq-instruments-pilote") + '"/>';
      s += '<line x1="' + n2(lx + 2 * EM) + '" y1="' + n2(yy + 1) + '" x2="' + n2(lx + 2 * EM) + '" y2="' + n2(yy + lh - 1) + '" class="mq-instruments-sep"/>' +
        '<line x1="' + n2(lx + lw - 2 * EM) + '" y1="' + n2(yy + 1) + '" x2="' + n2(lx + lw - 2 * EM) + '" y2="' + n2(yy + lh - 1) + '" class="mq-instruments-sep"/>';
      var op = l[3] ? "" : " mq-instruments-pale";
      s += '<text x="' + n2(lx + EM) + '" y="' + n2(yy + lh / 2 + 5) + '" class="mq-instruments-fleche' + op + '">‹</text>' +
        '<text x="' + n2(lx + lw - EM) + '" y="' + n2(yy + lh / 2 + 5) + '" class="mq-instruments-fleche' + op + '">›</text>';
      s += '<text x="' + n2(cxm) + '" y="' + n2(yy + 15.8) + '" class="mq-instruments-pint">' + l[0][0] + (l[0][1] ? '<tspan class="mq-instruments-min">' + l[0][1] + "</tspan>" : "") + "</text>";
      s += '<text x="' + n2(cxm) + '" y="' + n2(yy + 36) + '" class="mq-instruments-pval">' + l[1] + '<tspan class="mq-instruments-unite">' + l[2] + "</tspan></text>";
    });
    return s;
  }

  // ── le Vent 3 × 1 : le cadran en haut, TWS et TWA dessous
  function vent() {
    var x = caseX(2), y = caseY(1), w = largeur(1), h = hauteur(3);
    var iw = w - 2 - EM, ih = h - 2 - .7 * EM, D = Math.min(iw, ih - 3.8 * EM);
    var dx = x + 1 + .5 * EM + (iw - D) / 2, dy = y + 1 + .4 * EM, k = D / 192;
    var s = carte(x, y, w, h, "vent");
    var c = '<g transform="translate(' + n2(dx) + " " + n2(dy) + ") scale(" + n2(k) + ')"><circle cx="96" cy="96" r="84" class="mq-instruments-face"/>';
    // la bande : un arc par suite de degrés de même zone, de chaque bord
    [1, -1].forEach(function (cote) {
      var debut = 0;
      for (var d = 1; d <= 180; d++) {
        if (d === 180 || AN.zones[d] !== AN.zones[debut]) {
          var a0 = cote > 0 ? debut : -d, a1 = cote > 0 ? d : -debut;
          c += '<path d="' + arc(96, 96, 79, a0, a1) + '" class="mq-instruments-bande mq-instruments-z-' + AN.zones[debut] + '"/>';
          debut = d;
        }
      }
    });
    [AN.pres, -AN.pres, AN.portant, -AN.portant].forEach(function (a) {
      c += '<polygon points="' + pts([pa(96, 96, 85, a), pa(96, 96, 94, a - 3.6), pa(96, 96, 94, a + 3.6)]) + '" class="mq-instruments-cible"/>';
    });
    for (var t = 0; t < 360; t += 10) {
      var lg = t % 30 === 0, u = pa(96, 96, 75, t), v = pa(96, 96, lg ? 67 : 71, t);
      c += '<line x1="' + u[0] + '" y1="' + u[1] + '" x2="' + v[0] + '" y2="' + v[1] + '" class="mq-instruments-trait" stroke-width="' + (lg ? 1.6 : 1) + '"/>';
    }
    [0, 30, 60, 90, 120, 150, 180, -30, -60, -90, -120, -150].forEach(function (d) {
      var p = pa(96, 96, 57, d);
      c += '<text x="' + p[0] + '" y="' + n2(p[1] + 4) + '" class="mq-instruments-vchiffre">' + Math.abs(d) + "</text>";
    });
    function aiguille(angle, classe, lettre) {
      var tt = pa(96, 96, 57, angle);
      return '<g class="' + classe + '"><polygon points="' + pts([pa(96, 96, 73, angle), pa(96, 96, 4, angle + 90), pa(96, 96, 16, angle + 180), pa(96, 96, 4, angle - 90)]) + '"/>' +
        '<circle cx="' + tt[0] + '" cy="' + tt[1] + '" r="8.5"/><text x="' + tt[0] + '" y="' + n2(tt[1] + 4.25) + '" class="mq-instruments-lettre">' + lettre + "</text></g>";
    }
    c += aiguille(AWA, "mq-instruments-apparent", "A") + aiguille(TWA, "mq-instruments-vrai", "V") + '<circle cx="96" cy="96" r="5" class="mq-instruments-moyeu"/></g>';
    s += c;
    // les deux valeurs, centrées dans ce que laisse le cadran ; la pastille citron de TWA renvoie à l'aiguille V
    var haut = dy + D, reste = y + h - 1 - .3 * EM - haut, y1 = haut + (reste - 2.89 * EM) / 2;
    var col = (iw - 1.2 * EM) / 2, c1 = x + 1 + .5 * EM + col / 2, c2 = c1 + col + 1.2 * EM;
    s += '<text x="' + n2(c1) + '" y="' + n2(y1 + 8.6) + '" class="mq-instruments-int mq-instruments-centre">TWS</text>' +
      '<text x="' + n2(c1) + '" y="' + n2(y1 + 24.5) + '" class="mq-instruments-val mq-instruments-centre">' + chiffre(TWS, 1) + "</text>";
    s += '<circle cx="' + n2(c2 - 10.5) + '" cy="' + n2(y1 + 5.6) + '" r="' + n2(.35 * EM) + '" class="mq-instruments-pastille"/>' +
      '<text x="' + n2(c2 + 3) + '" y="' + n2(y1 + 8.6) + '" class="mq-instruments-int mq-instruments-centre">TWA</text>' +
      '<text x="' + n2(c2) + '" y="' + n2(y1 + 24.5) + '" class="mq-instruments-val mq-instruments-centre">' + Math.abs(TWA) + '<tspan class="mq-instruments-unite">°</tspan></text>';
    return s;
  }

  // ── les unitaires : V. BATEAU, V. POLAIRE (1 × 1) et la barre d'efficacité (1 × 2)
  function intitule(x, y, texte) {
    return '<text x="' + n2(x + 1 + 1.9 * EM) + '" y="' + n2(y + 1 + .35 * EM + 8.2) + '" class="mq-instruments-int">' + texte + "</text>";
  }
  function unitaire(col, rang, texte, valeur, unite) {
    var x = caseX(col), y = caseY(rang), w = largeur(1), h = hauteur(1);
    var haut = y + 1 + 1.6 * EM, bas = y + h - 1 - .2 * EM;
    return carte(x, y, w, h, "jauge") + intitule(x, y, texte) +
      '<text x="' + n2(x + w / 2) + '" y="' + n2((haut + bas) / 2 + 6) + '" class="mq-instruments-val mq-instruments-centre">' + valeur + '<tspan class="mq-instruments-unite">' + unite + "</tspan></text>";
  }
  function barre() {
    var x = caseX(0), y = caseY(5), w = largeur(2), h = hauteur(1);
    var s = carte(x, y, w, h, "jauge") + intitule(x, y, SW.t("EFFICACITÉ POLAIRE", "POLAR EFFICIENCY"));
    var palier = PERF >= 90 ? "haut" : PERF >= 70 ? "moyen" : "bas";
    s += '<text x="' + n2(x + w - 1 - .5 * EM) + '" y="' + n2(y + 1 + .4 * EM + 14.5) + '" class="mq-instruments-val mq-instruments-z-' + palier + '-txt" text-anchor="end">' + Math.round(PERF) + '<tspan class="mq-instruments-unite">%</tspan></text>';
    var bx = x + 1 + .5 * EM, bw = w - 2 - EM, haut = y + 1 + 2.6 * EM, bas = y + h - 1 - .3 * EM, bh = 1.3 * EM, by = (haut + bas) / 2 - bh / 2;
    s += '<rect x="' + n2(bx) + '" y="' + n2(by) + '" width="' + n2(bw) + '" height="' + n2(bh) + '" rx="' + n2(bh / 2) + '" fill="url(#mq-instruments-degrade)"/>';
    var cx = bx + Math.max(0, Math.min(100, (PERF - 50) * 2)) / 100 * bw;
    s += '<rect x="' + n2(cx - 2) + '" y="' + n2(by - 4) + '" width="4" height="' + n2(bh + 8) + '" rx="2" class="mq-instruments-curseur"/>';
    return s;
  }

  // ── le bloc bateau & voyage, dans la rangée du haut
  function bloc() {
    var x = X0, y = Y0 + 3, h = 45, s = "";
    var voyage = "MARSEILLE → SPLIT", w = 322;
    s += '<rect x="' + (x + .5) + '" y="' + (y + .5) + '" width="' + (w - 1) + '" height="' + (h - 1) + '" rx="8" class="mq-instruments-carte"/>';
    s += icone("voilier", x + 12, y + 16, 13, "mq-instruments-ic-acc") + '<text x="' + (x + 31) + '" y="' + (y + 27) + '" class="mq-instruments-bloc">C60</text>';
    s += '<circle cx="' + (x + 64) + '" cy="' + (y + 22.5) + '" r="1.2" class="mq-instruments-point"/>';
    s += icone("route", x + 74, y + 16, 13, "mq-instruments-ic-acc") + '<text x="' + (x + 93) + '" y="' + (y + 27) + '" class="mq-instruments-bloc">' + voyage + "</text>";
    s += '<rect x="' + (x + 234) + '" y="' + (y + 12) + '" width="78" height="21" rx="10.5" class="mq-instruments-nmea"/>' +
      '<circle cx="' + (x + 243) + '" cy="' + (y + 22.5) + '" r="2.6" class="mq-instruments-ok"/><text x="' + (x + 250) + '" y="' + (y + 26) + '" class="mq-instruments-nmea-txt">NMEA · ON</text>';
    return s;
  }

  // ── la carte : le bateau sur la route de la scène, son trait projeté au cap, les repères et leurs étiquettes
  function carteMarine() {
    var S = window.SCENES.corfou, s = window.MQ.cote(S);
    s += window.MQ.nom("Sicile", 351, 346) + window.MQ.nom("Messine", 428, 311) + window.MQ.nom("Corfou", 548, 214) + window.MQ.nom(SW.t("Croatie", "Croatia"), 439, 29);
    var bx = 478.5, by = 293.5, PX_MILLE = 0.7, ux = Math.sin(CAP * r), uy = -Math.cos(CAP * r);
    var fin = HORIZON_H * STW * PX_MILLE;
    s += '<line x1="' + bx + '" y1="' + by + '" x2="' + n2(bx + ux * fin) + '" y2="' + n2(by + uy * fin) + '" class="mq-instruments-projete"/>';
    var REPERES = [30, 60, 120, 180, 360, 720, 1440, 2880], ETIQUETEES = { 180: 1, 360: 1, 720: 1 }, marques = "";
    REPERES.forEach(function (mn, rang) {
      var d = mn / 60 * STW * PX_MILLE, px = bx + ux * d, py = by + uy * d;
      if (mn > HORIZON_H * 60) return;
      marques += '<circle cx="' + n2(px) + '" cy="' + n2(py) + '" r="' + n2(2 + 1.5 * rang / 7) + '" class="mq-instruments-repere"/>';
      if (ETIQUETEES[mn]) {
        var t = mn < 60 ? mn + " min" : mn / 60 + " h", lw = 14 + t.length * 7;
        marques += '<rect x="' + n2(px + 5.6) + '" y="' + n2(py - 8.4) + '" width="' + (lw - 1.2) + '" height="16.8" rx="8.4" class="mq-instruments-etiq"/>' +
          '<text x="' + n2(px + 5 + lw / 2) + '" y="' + n2(py + 4) + '" class="mq-instruments-etiq-txt">' + t + "</text>";
      }
    });
    // la petite flèche du bout du trait
    s += '<path d="M0 -4.5L3.6 2.4L-3.6 2.4Z" transform="translate(' + n2(bx + ux * (fin + 3)) + " " + n2(by + uy * (fin + 3)) + ") rotate(" + CAP + ')" class="mq-instruments-fleche-trait"/>';
    s += marques;
    s += '<circle cx="' + bx + '" cy="' + by + '" r="11" fill="#9B59B6" stroke="#fff" stroke-width="3"/>' +
      '<path d="M0 -7L5.5 6L0 3L-5.5 6Z" transform="translate(' + bx + " " + by + ") rotate(" + CAP + ')" fill="#fff"/>';
    return s;
  }

  var STYLE = "<style>" +
    ".mq-instruments{--i-surface:#16222e;--i-surface-2:#1e2d3c;--i-surface-3:#28394a;--i-texte:#f4f4f5;--i-valeur:#c6efe9;--i-intitule:#8fb3ae;" +
    "--i-accent:#bef264;--i-apparent:#5FB4FF;--i-magenta:#E879F9;--i-vert:#4ade80;--i-ambre:#fbbf24;--i-rouge:#f87171;" +
    "--i-b-rouge:#f87171;--i-b-ambre:#fbbf24;--i-b-vert:#4ade80;--i-ombre:rgb(0 0 0/.5)}" +
    ":root[data-theme=light] .mq-instruments{--i-surface:#ffffff;--i-surface-2:#f3f7fa;--i-surface-3:#e4ecf2;--i-texte:#0e1822;--i-valeur:#0b5160;" +
    "--i-intitule:#4b6466;--i-accent:#4d7c0f;--i-apparent:#185FA5;--i-magenta:#A21CAF;--i-vert:#0f7033;--i-ambre:#945104;--i-rouge:#dc2626;" +
    "--i-b-rouge:#dc2626;--i-b-ambre:#d97706;--i-b-vert:#16a34a;--i-ombre:rgb(14 24 34/.14)}" +
    ".mq-instruments text{font-family:var(--mono)}" +
    ".mq-instruments-carte{fill:color-mix(in srgb,var(--i-surface) 95%,transparent);stroke:color-mix(in srgb,var(--i-texte) 70%,transparent);filter:drop-shadow(0 8px 14px var(--i-ombre))}" +
    ".mq-instruments-ic{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
    ".mq-instruments-ic-int{stroke:var(--i-intitule)}.mq-instruments-ic-acc{stroke:var(--i-accent)}" +
    ".mq-instruments-face{fill:var(--i-surface-2);stroke:color-mix(in srgb,var(--i-valeur) 25%,transparent)}" +
    ".mq-instruments-cercle{fill:none;stroke:color-mix(in srgb,var(--i-valeur) 22%,transparent);stroke-dasharray:2 3}" +
    ".mq-instruments-trait{stroke:var(--i-intitule)}" +
    ".mq-instruments-pchiffre{fill:var(--i-intitule);font-size:16px}" +
    ".mq-instruments-vchiffre{fill:var(--i-intitule);font-size:13px;text-anchor:middle}" +
    ".mq-instruments-courbe{fill:none;stroke:var(--i-intitule);stroke-width:3;stroke-linejoin:round}" +
    ".mq-instruments-optimum{stroke:var(--i-magenta);stroke-width:4}" +
    ".mq-instruments-ventp{fill:var(--i-valeur)}" +
    ".mq-instruments-reel{stroke:var(--i-accent);stroke-width:4.5;stroke-linecap:round}" +
    ".mq-instruments-ppol{fill:none;stroke:var(--i-accent);stroke-width:3}" +
    ".mq-instruments-pstw{fill:var(--i-accent)}" +
    ".mq-instruments-moyeu{fill:var(--i-valeur)}" +
    ".mq-instruments-poignee{fill:var(--i-accent);stroke:var(--i-surface);stroke-width:1}" +
    ".mq-instruments-pilote{fill:none;stroke:color-mix(in srgb,var(--i-valeur) 22%,transparent)}" +
    ".mq-instruments-pilote-actif{fill:none;stroke:var(--i-accent);stroke-width:2}" +
    ".mq-instruments-sep{stroke:color-mix(in srgb,var(--i-valeur) 15%,transparent)}" +
    ".mq-instruments-fleche{fill:var(--i-valeur);font-size:14.5px;text-anchor:middle}" +
    ".mq-instruments-pale{opacity:.35}" +
    ".mq-instruments-pint{fill:var(--i-intitule);font-size:8.5px;letter-spacing:.06em;text-anchor:middle}" +
    ".mq-instruments-pval{fill:var(--i-valeur);font-size:20.4px;font-weight:600;text-anchor:middle;font-variant-numeric:tabular-nums}" +
    ".mq-instruments-unite{font-size:.6em;font-weight:600}" +
    ".mq-instruments-bande{fill:none;stroke-width:6}" +
    ".mq-instruments-z-neutre{stroke:var(--i-surface-3)}.mq-instruments-z-haut{stroke:var(--i-vert)}.mq-instruments-z-moyen{stroke:var(--i-ambre)}.mq-instruments-z-bas{stroke:var(--i-rouge)}" +
    ".mq-instruments-z-haut-txt{fill:var(--i-vert)}.mq-instruments-z-moyen-txt{fill:var(--i-ambre)}.mq-instruments-z-bas-txt{fill:var(--i-rouge)}" +
    ".mq-instruments-cible{fill:var(--i-magenta)}" +
    ".mq-instruments-vrai{fill:var(--i-accent)}.mq-instruments-apparent{fill:var(--i-apparent)}" +
    ".mq-instruments-lettre{fill:var(--i-surface);font-size:11.5px;font-weight:700;text-anchor:middle}" +
    ".mq-instruments-int{fill:var(--i-intitule);font-size:8.5px;letter-spacing:.06em}" +
    ".mq-instruments-min{text-transform:none}" +
    ".mq-instruments-val{fill:var(--i-valeur);font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}" +
    ".mq-instruments-centre{text-anchor:middle}" +
    ".mq-instruments-pastille{fill:var(--i-accent)}" +
    ".mq-instruments-curseur{fill:var(--i-valeur);stroke:color-mix(in srgb,var(--i-surface) 95%,var(--sea));stroke-width:1.5;paint-order:stroke}" +
    ".mq-instruments-bloc{fill:var(--i-texte);font-size:10px;font-weight:700;letter-spacing:.1em}" +
    ".mq-instruments-point{fill:var(--i-intitule)}" +
    ".mq-instruments-nmea{fill:color-mix(in srgb,var(--i-vert) 12%,transparent)}" +
    ".mq-instruments-ok{fill:var(--i-vert)}" +
    ".mq-instruments-nmea-txt{fill:var(--i-vert);font-size:8.5px;font-weight:700;letter-spacing:.06em}" +
    ".mq-instruments-projete{stroke:#A855F7;stroke-width:1.5;stroke-dasharray:1.5 3.75;stroke-opacity:.9}" +
    ".mq-instruments-fleche-trait{fill:#A855F7;fill-opacity:.9}" +
    ".mq-instruments-repere{fill:#A855F7;fill-opacity:.9;stroke:#fff;stroke-width:1}" +
    ".mq-instruments-etiq{fill:#fff;stroke:#A855F7;stroke-width:1.2}" +
    ".mq-instruments-etiq-txt{font:600 12px -apple-system,'Segoe UI',sans-serif !important;fill:#0E1822;text-anchor:middle}" +
    "</style>";

  M.instruments = function () {
    var degrade = '<defs><linearGradient id="mq-instruments-degrade"><stop offset="0" stop-color="var(--i-b-rouge)"/><stop offset=".34" stop-color="var(--i-b-rouge)"/>' +
      '<stop offset=".46" stop-color="var(--i-b-ambre)"/><stop offset=".74" stop-color="var(--i-b-ambre)"/><stop offset=".86" stop-color="var(--i-b-vert)"/><stop offset="1" stop-color="var(--i-b-vert)"/></linearGradient></defs>';
    return '<svg class="mq-instruments" viewBox="0 12 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + STYLE + degrade +
      carteMarine() + bloc() + polaire() + vent() +
      unitaire(0, 4, SW.t("V. BATEAU", "BOAT SPD"), chiffre(STW, 1), "kts") + unitaire(1, 4, SW.t("V. POLAIRE", "POLAR SPD"), chiffre(VPOL, 1), "kts") +
      barre() + "</svg>";
  };
})();
