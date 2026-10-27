/* Maquettes des domaines de la page Fonctionnalités : dessinées en SVG, sur les vraies côtes de scenes.js,
   avec les formes et les couleurs relevées dans le code de l'application. Chaque maquette rend une chaîne SVG ;
   la page l'insère dans le cadre du domaine (champ "maquette" du catalogue) et la refait au changement de langue. */
(function () {
  var MILLE = 17.8; // pixels de la scène Morbihan par mille (scene.py : 0,375° de latitude, soit 22,5 milles, pour 400 px)

  function chemin(p) {
    var d = "M" + p[0] + " " + p[1];
    for (var i = 2; i < p.length; i += 2) d += "L" + p[i] + " " + p[i + 1];
    return d + "Z";
  }
  function cote(S) {
    return '<rect x="0" y="0" width="' + S.W + '" height="' + S.H + '" fill="var(--sea)"/>' +
      '<path d="' + S.terre.map(chemin).join("") + '" fill="var(--land)" stroke="var(--coast)" stroke-width=".8"/>';
  }
  function nom(t, x, y) {
    return '<text x="' + x + '" y="' + y + '" class="mq-lieu" text-anchor="middle">' + t + "</text>";
  }
  function deg(a) { return a * Math.PI / 180; }
  // vitesse en pixels par minute, cap en degrés vrais (0 = nord, y vers le bas)
  function vitesse(cap, sog) { var v = sog / 60 * MILLE; return [v * Math.sin(deg(cap)), -v * Math.cos(deg(cap))]; }

  // CPA / TCPA comme l'application (packages/db/src/ais/cpa.ts) : mouvement relatif rectiligne ; une cible
  // qui s'éloigne n'a ni CPA ni TCPA. Seuils par défaut (risk.ts) : collision < 0,5 M et < 15 min ;
  // vigilance < 1 M et < 30 min.
  function approche(moi, c) {
    var vm = vitesse(moi.cap, moi.sog), vc = vitesse(c.cap, c.sog);
    var rx = c.x - moi.x, ry = c.y - moi.y, vx = vc[0] - vm[0], vy = vc[1] - vm[1];
    var dist = Math.hypot(rx, ry) / MILLE, v2 = vx * vx + vy * vy;
    var t = v2 > 0 ? -(rx * vx + ry * vy) / v2 : -1;
    if (t <= 0) return { dist: dist, cpa: null, tcpa: null, risque: "ok" };
    var cpa = Math.hypot(rx + vx * t, ry + vy * t) / MILLE;
    var risque = cpa < 0.5 && t < 15 ? "collision" : cpa < 1 && t < 30 ? "vigilance" : "ok";
    return { dist: dist, cpa: cpa, tcpa: t, risque: risque };
  }

  // ── Météo. Palette du vent de l'application (weather-grib/src/render.rs, seuils en nœuds) ; la carte la pose à
  //    l'opacité 0,7 (WeatherLayersRenderer.ts). Particules : trait de 1,2 px, gris clair la nuit, gris charbon le jour.
  var PALETTE_VENT = [[0, [30, 130, 255]], [3, [0, 160, 255]], [6, [0, 210, 230]], [9, [0, 255, 180]], [12, [0, 255, 150]],
    [15, [100, 255, 50]], [18, [255, 240, 0]], [21, [255, 200, 0]], [24, [255, 160, 0]], [27, [255, 120, 0]], [30, [255, 80, 0]],
    [33, [255, 40, 0]], [36, [255, 0, 0]], [39, [220, 0, 0]], [42, [180, 0, 20]], [50, [140, 0, 60]], [60, [117, 26, 127]], [75, [72, 40, 75]]];
  function couleurVent(kt) {
    var P = PALETTE_VENT;
    if (kt <= 0) return P[0][1];
    for (var i = 0; i < P.length - 1; i++) {
      if (kt < P[i + 1][0]) {
        var f = (kt - P[i][0]) / (P[i + 1][0] - P[i][0]), a = P[i][1], b = P[i + 1][1];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      }
    }
    return P[P.length - 1][1];
  }
  // un vrai champ de vent (maquettes/vent-atlantique.js, tiré d'un fichier GRIB de l'application) : [est, bas] en nœuds
  // au point (x, y) de la scène, interpolé entre les cases ; null hors du fichier
  function ventReel(x, y) {
    var W = window.MQ_VENT, fx = x / W.pas - .5, fy = y / W.pas - .5;
    var i = Math.max(0, Math.min(W.nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(W.ny - 2, Math.floor(fy)));
    var a = Math.max(0, Math.min(1, fx - i)), b = Math.max(0, Math.min(1, fy - j)), k = j * W.nx + i, n = W.nx, U = W.u, V = W.v;
    if (U[k] === null || U[k + 1] === null || U[k + n] === null || U[k + n + 1] === null) return null;
    return [(U[k] * (1 - a) + U[k + 1] * a) * (1 - b) + (U[k + n] * (1 - a) + U[k + n + 1] * a) * b,
      (V[k] * (1 - a) + V[k + 1] * a) * (1 - b) + (V[k + n] * (1 - a) + V[k + n + 1] * a) * b];
  }
  function lireVar(nom) { return getComputedStyle(document.documentElement).getPropertyValue(nom).trim(); }
  function estJour() { var c = lireVar("--sea").replace("#", ""); return parseInt(c.slice(0, 2), 16) > 128; }

  function animerMeteo(boite) {
    var S = window.SCENES["new-york"], fond = boite.querySelector(".mq-fond"), part = boite.querySelector(".mq-part");
    var gf = fond.getContext("2d"), gp = part.getContext("2d"), terre = new Path2D();
    S.terre.forEach(function (p) { terre.addPath(new Path2D(chemin(p))); });
    // où est la terre (les particules n'y vont pas) : une grille de 5 px
    var masque = [], essai = document.createElement("canvas").getContext("2d");
    for (var j = 0; j < 80; j++) for (var i = 0; i < 120; i++) masque.push(essai.isPointInPath(terre, i * 5 + 2.5, j * 5 + 2.5));
    function surTerre(x, y) { var i = x / 5 | 0, j = y / 5 | 0; return i < 0 || j < 0 || i >= 120 || j >= 80 || masque[j * 120 + i]; }
    function peindreFond() {
      gf.setTransform(2, 0, 0, 2, 0, -24);
      gf.fillStyle = lireVar("--sea"); gf.fillRect(0, 0, 600, 400);
      var c = document.createElement("canvas"); c.width = 120; c.height = 80;
      var cg = c.getContext("2d"), im = cg.createImageData(120, 80);
      var W = window.MQ_VENT;
      for (var k = 0; k < 120 * 80; k++) {
        if (W.u[k] === null) continue;  // hors du fichier : pas de couleur, comme dans l'application
        var col = couleurVent(Math.hypot(W.u[k], W.v[k]));
        im.data[k * 4] = col[0]; im.data[k * 4 + 1] = col[1]; im.data[k * 4 + 2] = col[2]; im.data[k * 4 + 3] = 210;
      }
      cg.putImageData(im, 0, 0);
      gf.globalAlpha = 0.7; gf.imageSmoothingEnabled = true; gf.drawImage(c, 0, 0, 600, 400); gf.globalAlpha = 1;
      gf.fillStyle = lireVar("--land"); gf.strokeStyle = lireVar("--coast"); gf.lineWidth = 0.8; gf.fill(terre); gf.stroke(terre);
      gf.font = "500 10px " + lireVar("--mono"); gf.fillStyle = lireVar("--dim"); gf.textAlign = "center";
      gf.fillText("Terre-Neuve", 160, 228); gf.fillText(SW.t("Açores", "Azores"), 388, 340);
    }
    var N = 800, pts = [], couleur;
    function naitre(p) { do { p.x = Math.random() * 600; p.y = 12 + Math.random() * 375; } while (surTerre(p.x, p.y) || !ventReel(p.x, p.y)); p.age = Math.random() * 70 | 0; return p; }
    for (var n = 0; n < N; n++) pts.push(naitre({}));
    function teinte() { couleur = estJour() ? "rgba(100,115,135,.92)" : "rgba(220,222,230,.92)"; }
    function pas() {
      gp.setTransform(2, 0, 0, 2, 0, -24);
      gp.globalCompositeOperation = "destination-out"; gp.fillStyle = "rgba(0,0,0,.12)"; gp.fillRect(0, 0, 600, 400);
      gp.globalCompositeOperation = "source-over"; gp.strokeStyle = couleur; gp.lineWidth = 1.2; gp.beginPath();
      pts.forEach(function (p) {
        var w = ventReel(p.x, p.y);
        if (!w) { naitre(p); p.age = 0; return; }
        var nx = p.x + w[0] * 0.05, ny = p.y + w[1] * 0.05;
        if (++p.age > 70 || surTerre(nx, ny)) { naitre(p); p.age = 0; return; }
        gp.moveTo(p.x, p.y); gp.lineTo(nx, ny); p.x = nx; p.y = ny;
      });
      gp.stroke();
    }
    peindreFond(); teinte();
    var calme = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, vu = false;
    if (calme) { for (var s = 0; s < 40; s++) pas(); }
    else {
      (function boucle() { if (!boite.isConnected) return; if (vu) pas(); requestAnimationFrame(boucle); })();
      if (window.IntersectionObserver) new IntersectionObserver(function (e) { vu = e[0].isIntersecting; }).observe(boite); else vu = true;
    }
    function refaire() { if (boite.isConnected) { peindreFond(); teinte(); gp.setTransform(1, 0, 0, 1, 0, 0); gp.clearRect(0, 0, part.width, part.height); } }
    new MutationObserver(refaire).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (window.matchMedia) matchMedia("(prefers-color-scheme: light)").addEventListener("change", refaire);
  }

  // le widget Météo au format standard (en-tête, boutons des couches, fichiers) et la frise compacte du bas
  function widgetMeteo() {
    var x = 380, y = 24, s = "";
    s += '<g class="mq-panneau"><rect x="' + x + '" y="' + y + '" width="210" height="128" rx="8"/>';
    s += '<path d="M' + (x + 9) + " " + (y + 17) + 'a3.4 3.4 0 0 1 6.4-1.6a2.6 2.6 0 0 1 2.4 4.1h-7.4a2 2 0 0 1-1.4-2.5" class="mq-trait-acc"/>';
    s += '<text x="' + (x + 24) + '" y="' + (y + 19) + '" class="mq-p-tete mq-blanc">' + SW.t("Météo", "Weather") + "</text>";
    s += '<circle cx="' + (x + 84) + '" cy="' + (y + 16) + '" r="2.4" fill="#4ade80"/><text x="' + (x + 90) + '" y="' + (y + 19) + '" class="mq-ok">OK</text>';
    s += '<text x="' + (x + 200) + '" y="' + (y + 19) + '" text-anchor="end" class="mq-gris">↻  ⤢  –  ×</text>';
    s += '<line x1="' + (x + 8) + '" y1="' + (y + 27) + '" x2="' + (x + 202) + '" y2="' + (y + 27) + '" class="mq-p-filet"/>';
    var icones = ["M-5 -3h7a2 2 0 1 0-2-2M-5 0h9M-5 3h6a2 2 0 1 1-2 2", "M0 -5L1.2 -1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2 -1.2Z",
      "M-5 -2q2.5-2 5 0t5 0M-5 2.5q2.5-2 5 0t5 0", "M-5 -2h9l-2.5-2.5M5 2h-9l2.5 2.5", "M-5 0q5-5.5 10 0q-5 5.5-10 0M-4.5 -4.5L4.5 4.5"];
    icones.forEach(function (d, i) {
      var cx = x + 118 + i * 19, cy = y + 39;
      if (i === 1) s += '<rect x="' + (cx - 8) + '" y="' + (cy - 8) + '" width="16" height="16" rx="4" class="mq-actif"/>';
      s += '<path d="' + d + '" transform="translate(' + cx + " " + cy + ')" class="' + (i === 1 ? "mq-trait-acc" : "mq-trait") + '"/>';
    });
    // les fichiers réellement chargés sur cette zone (le vent de la maquette vient du premier)
    [["RHUM-SAILAWAY-20261026-12Z", "var(--c-wind)"], ["RHUM-GFS-WAVE025-20261026-12Z", "#F59E0B"], ["RHUM-OSCAR025-20261024-00Z", "#E879F9"]].forEach(function (f, i) {
      var fy = y + 54 + i * 23;
      s += '<rect x="' + (x + 8) + '" y="' + fy + '" width="194" height="19" rx="3" class="mq-ligne"/><rect x="' + (x + 8) + '" y="' + fy + '" width="2.5" height="19" fill="' + f[1] + '"/>';
      s += '<circle cx="' + (x + 20) + '" cy="' + (fy + 9.5) + '" r="3.6" fill="none" stroke="#4ade80" stroke-width="1"/><path d="M' + (x + 18.3) + " " + (fy + 9.6) + "l1.2 1.2l2.2-2.4" + '" fill="none" stroke="#4ade80" stroke-width="1"/>';
      s += '<text x="' + (x + 28) + '" y="' + (fy + 12.5) + '" class="mq-fichier">' + f[0] + '</text><text x="' + (x + 184) + '" y="' + (fy + 12.5) + '" text-anchor="end" class="mq-gris">↻</text>';
      // la corbeille
      s += '<path d="M' + (x + 190) + " " + (fy + 6.5) + "h7M" + (x + 192.2) + " " + (fy + 6.5) + "v-1.2h2.6v1.2M" + (x + 191) + " " + (fy + 6.5) + "l.6 7h4.8l.6-7" + '" class="mq-trait"/>';
    });
    s += "</g>";
    // WeatherTimeline.tsx (compacte) : « ‹ heure › » puis la bascule de la carte
    s += '<g class="mq-panneau"><rect x="190" y="352" width="220" height="26" rx="8"/>' +
      '<text x="204" y="369" class="mq-gris mq-gros">«  ‹</text><text x="295" y="369" text-anchor="middle" class="mq-heure">02/11 01:00 UTC+1</text>' +
      '<text x="352" y="369" class="mq-gris mq-gros">›  »</text><line x1="380" y1="358" x2="380" y2="372" class="mq-p-filet"/>' +
      '<path d="M388 360l5-2l5 2l5-2v10l-5 2l-5-2l-5 2zM393 358v10M398 360v10" class="mq-trait"/></g>';
    return s;
  }

  // le chevron des cibles AIS (AisMapOverlay.tsx : 16 × 20 px, #E74C3C, tourné au cap)
  var CHEVRON = "M0 -10L8 8L0 4L-8 8Z";

  // les outils communs, pour les maquettes rangées une par fichier dans assets/maquettes/<domaine>.js
  window.MQ = { MILLE: MILLE, chemin: chemin, cote: cote, nom: nom, vitesse: vitesse, approche: approche, lireVar: lireVar,
    estJour: estJour, couleurVent: couleurVent, ventReel: ventReel, CHEVRON: CHEVRON };

  var M = window.MAQUETTES = window.MAQUETTES || {};
  Object.assign(M, {
    veille: function () {
      var S = window.SCENES.morbihan;
      var moi = { x: 372, y: 196, cap: 232, sog: 6.4 };
      var cibles = [
        { nom: "ENEZ HOUAD", x: 294, y: 176, cap: 116, sog: 18.4 },
        { nom: "AR VAG", x: 312, y: 242, cap: 24, sog: 3.6 },
        { nom: "IZEL", x: 318, y: 120, cap: 196, sog: 5.2 }
      ];
      var vecteurs = "", marques = "", etiquettes = "";
      cibles.forEach(function (c) {
        c.a = approche(moi, c);
        var v = vitesse(c.cap, c.sog);
        if (c.sog > 0.5) vecteurs += '<line x1="' + c.x + '" y1="' + c.y + '" x2="' + (c.x + v[0] * 180) + '" y2="' + (c.y + v[1] * 180) + '" class="mq-vecteur"/>';
        marques += '<path d="' + CHEVRON + '" transform="translate(' + c.x + " " + c.y + ") rotate(" + c.cap + ') scale(.85)" class="mq-cible' + (c.a.risque === "collision" ? " mq-clignote" : "") + '"/>';
        // l'étiquette passe au-dessus quand la cible fait route au sud, pour ne pas cacher son vecteur
        var dessus = c.cap > 90 && c.cap < 270, y = dessus ? c.y - 24 : c.y + 22;
        var ligne2 = c.sog.toFixed(1) + " kn";
        if (c.a.risque !== "ok") ligne2 += " · CPA " + c.a.cpa.toFixed(2) + " / " + Math.round(c.a.tcpa) + "'";
        etiquettes += '<text x="' + c.x + '" y="' + y + '" text-anchor="middle" class="mq-etiq"><tspan class="mq-nom">' + c.nom +
          '</tspan><tspan x="' + c.x + '" dy="11" class="mq-l2' + (c.a.risque !== "ok" ? " mq-" + c.a.risque : "") + '">' + ligne2 + "</tspan></text>";
      });
      // le bateau (ownShip.ts) : pastille violette #9B59B6 bordée de blanc, flèche #A855F7 au cap, ligne de foi violette
      var foi = vitesse(moi.cap, 1);
      var bateau = '<line x1="' + moi.x + '" y1="' + moi.y + '" x2="' + (moi.x + foi[0] * 140) + '" y2="' + (moi.y + foi[1] * 140) + '" class="mq-foi"/>' +
        '<circle cx="' + moi.x + '" cy="' + moi.y + '" r="8" fill="#9B59B6" stroke="#fff" stroke-width="2.5"/>' +
        '<path d="M0 -6L4.5 5L0 2.5L-4.5 5Z" transform="translate(' + moi.x + " " + moi.y + ") rotate(" + moi.cap + ')" fill="#fff"/>';
      // le panneau de la carte (MapDock.tsx) : les cibles rangées par CPA, puis par distance
      var rang = cibles.slice().sort(function (p, q) { return ((p.a.cpa === null ? 9999 : p.a.cpa) - (q.a.cpa === null ? 9999 : q.a.cpa)) || (p.a.dist - q.a.dist); });
      // index.css (.ais-detail-panel) : titre en capitales à l'accent, filet dessous, nom à gauche et ligne grise à droite
      var px = 342, py = 290, lignes = "";
      rang.forEach(function (c, i) {
        var a = c.a, txt = a.cpa !== null ? "CPA " + a.cpa.toFixed(2) + " NM" : a.dist.toFixed(1) + " NM";
        if (a.tcpa !== null) txt += " · " + Math.round(a.tcpa) + " min";
        if (a.risque !== "ok") txt = (a.risque === "collision" ? "Collision" : "Vigilance") + " · " + txt;
        var y = py + 38 + i * 16;
        lignes += '<text x="' + (px + 10) + '" y="' + y + '" class="mq-p-nom">' + c.nom + '</text><text x="' + (px + 240) + '" y="' + y + '" text-anchor="end" class="mq-p-meta">' + txt + "</text>";
      });
      var panneau = '<g class="mq-panneau"><rect x="' + px + '" y="' + py + '" width="250" height="' + (46 + rang.length * 16) + '" rx="8"/>' +
        '<text x="' + (px + 10) + '" y="' + (py + 16) + '" class="mq-p-tete">' + SW.t("AIS — " + rang.length + " cibles à portée", "AIS — " + rang.length + " targets in range") + "</text>" +
        '<line x1="' + (px + 10) + '" y1="' + (py + 23) + '" x2="' + (px + 240) + '" y2="' + (py + 23) + '" class="mq-p-filet"/>' + lignes +
        '<text x="' + (px + 10) + '" y="' + (py + 36 + rang.length * 16) + '" class="mq-p-lien">' + SW.t("Tout voir →", "View all →") + "</text></g>";
      return '<svg viewBox="0 12 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cote(S) +
        nom("Quiberon", 166, 112) + nom("Port-Navalo", 404, 139) +nom("Belle-Île", 144, 372) +
        vecteurs + bateau + marques + etiquettes + panneau + "</svg>";
    },
    meteo: function () {
      return '<div class="mq-anime" data-anime="meteo"><canvas class="mq-fond" width="1200" height="750"></canvas><canvas class="mq-part" width="1200" height="750"></canvas>' +
        '<svg viewBox="0 12 600 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + widgetMeteo() + "</svg></div>";
    }
  });
  // ── La première page du rapport PDF d'un voyage, comme l'application la compose (lib/voyageReport/composer.ts :
  //    Helvetica, couleurs C.primary / secondary / muted / accent / border, rose des vents en 8 secteurs, barre des allures).
  //    Voyage réel BARCELONE → MARSEILLE (32 points GPS, maquettes/rapport-barcelone.js) ; les chiffres sont ceux du rapport
  //    que l'application en a tiré le 28/09/2026.
  M.rapport = function () {
    var R = window.MQ_RAPPORT, s = "", k = 1.5, mx = 55, my = 165;
    var C = { primary: "#0a1929", secondary: "#475569", muted: "#94a3b8", accent: "#65a30d", lime: "#bef264",
      border: "#e2e8f0", blue: "#2563eb", amber: "#d97706" };
    function txt(x, y, t, cl, ancre) { return '<text x="' + x + '" y="' + y + '" class="' + cl + '"' + (ancre ? ' text-anchor="' + ancre + '"' : "") + ">" + t + "</text>"; }
    s += '<style>.rp-h{font-family:Helvetica,Arial,sans-serif}.rp-t{font:400 31px Helvetica,Arial,sans-serif;fill:' + C.primary +
      '}.rp-s{font:400 13px Helvetica,Arial,sans-serif;fill:' + C.secondary + '}.rp-m{font:400 13px Helvetica,Arial,sans-serif;fill:' + C.primary +
      '}.rp-l{font:400 8.5px Helvetica,Arial,sans-serif;fill:' + C.muted + ';letter-spacing:.04em}.rp-v{font:400 17px Courier,monospace;fill:' + C.primary +
      '}.rp-p{font:400 9.5px Helvetica,Arial,sans-serif;fill:' + C.muted + '}.rp-g{font:400 9px Helvetica,Arial,sans-serif;fill:' + C.secondary + '}</style>';
    s += '<rect width="1160" height="820" fill="#fff"/>';
    s += txt(mx, 82, SW.t("BARCELONE — MARSEILLE", "BARCELONA — MARSEILLE"), "rp-t");
    s += txt(mx, 110, SW.t("BVR-042 · 28/08/2026 – 30/08/2026 · 1j 11h 37min · Mode Compétiteur (tout le voyage)",
      "BVR-042 · 28/08/2026 – 30/08/2026 · 1d 11h 37min · Racer mode (whole voyage)"), "rp-s");
    s += txt(1114, 82, "Sailaware", "rp-m", "end") + '<line x1="1044" y1="92" x2="1114" y2="92" stroke="' + C.lime + '" stroke-width="2"/>';
    s += '<line x1="' + mx + '" y1="150" x2="1114" y2="150" stroke="' + C.border + '"/>';
    // la carte : la côte réelle et la vraie trace (trait vert, points noirs, D et A)
    s += '<clipPath id="rp-cadre"><rect width="' + R.W + '" height="' + R.H + '"/></clipPath>' +
      '<g transform="translate(' + mx + " " + my + ") scale(" + k + ')" clip-path="url(#rp-cadre)"><rect width="' + R.W + '" height="' + R.H + '" fill="#eef4fa"/>' +
      '<path d="' + R.terre.map(chemin).join("") + '" fill="#f3ecd9" stroke="#c8bfa5" stroke-width=".6"/>';
    var tr = R.trace, d = "M" + tr[0] + " " + tr[1];
    for (var i = 2; i < tr.length; i += 2) d += "L" + tr[i] + " " + tr[i + 1];
    s += '<path d="' + d + '" fill="none" stroke="' + C.lime + '" stroke-width="2.2" stroke-linejoin="round"/>';
    for (i = 2; i < tr.length - 2; i += 2) s += '<circle cx="' + tr[i] + '" cy="' + tr[i + 1] + '" r="1.3" fill="#111"/>';
    var n = tr.length;
    s += '<circle cx="' + tr[0] + '" cy="' + tr[1] + '" r="5" fill="#22c55e" stroke="#fff" stroke-width="1"/><text x="' + tr[0] + '" y="' + (tr[1] + 2.3) + '" text-anchor="middle" class="rp-h" font-size="6.5" font-weight="700" fill="#fff">D</text>';
    s += '<circle cx="' + tr[n - 2] + '" cy="' + tr[n - 1] + '" r="5" fill="#ef4444" stroke="#fff" stroke-width="1"/><text x="' + tr[n - 2] + '" y="' + (tr[n - 1] + 2.3) + '" text-anchor="middle" class="rp-h" font-size="6.5" font-weight="700" fill="#fff">A</text>';
    s += '<rect width="' + R.W + '" height="' + R.H + '" fill="none" stroke="#111" stroke-width="1"/></g>';
    // les quatre chiffres
    var x0 = 785, x1 = 950;
    [[SW.t("DISTANCE", "DISTANCE"), "194 NM"], [SW.t("DURÉE", "DURATION"), SW.t("1j 11h 37min", "1d 11h 37min")],
      [SW.t("VITESSE MOY.", "AVG SPEED"), "5.4 kn"], ["POINTS", R.n + " (" + R.gps + "G)"]].forEach(function (c, i) {
      var x = i % 2 ? x1 : x0, y = 172 + (i >> 1) * 116;
      s += txt(x + 3, y + 12, c[0], "rp-l") + txt(x + 3, y + 102, c[1], "rp-v");
    });
    s += '<line x1="' + (x1 - 2) + '" y1="172" x2="' + (x1 - 2) + '" y2="396" stroke="' + C.border + '"/><line x1="' + x0 + '" y1="282" x2="1106" y2="282" stroke="' + C.border + '"/>';
    // le vent rencontré : la rose en 8 secteurs (le plus grand à 95 % du rayon), puis TWS et TWD
    s += '<rect x="' + x0 + '" y="414" width="9" height="13" fill="' + C.lime + '"/>' + txt(x0 + 15, 425, SW.t("VENT RENCONTRÉ", "WIND ENCOUNTERED"), "rp-g");
    var cx = 882, cy = 535, r = 88;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f8fafc" stroke="' + C.border + '"/>';
    [.33, .66].forEach(function (f) { s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * f + '" fill="none" stroke="' + C.border + '" stroke-dasharray="2 2"/>'; });
    s += '<path d="M' + cx + " " + (cy - r) + "V" + (cy + r) + "M" + (cx - r) + " " + cy + "H" + (cx + r) + '" stroke="' + C.border + '"/>';
    R.rose.forEach(function (p, i) {
      if (p <= 0) return;
      var a0 = (i * 45 - 90) * Math.PI / 180, a1 = a0 - Math.PI / 8, a2 = a0 + Math.PI / 8, l = p * r * .95;
      s += '<path d="M' + cx + " " + cy + "L" + (cx + l * Math.cos(a1)).toFixed(1) + " " + (cy + l * Math.sin(a1)).toFixed(1) + "L" + (cx + l * Math.cos(a0)).toFixed(1) +
        " " + (cy + l * Math.sin(a0)).toFixed(1) + "L" + (cx + l * Math.cos(a2)).toFixed(1) + " " + (cy + l * Math.sin(a2)).toFixed(1) + 'Z" fill="' + C.accent + '"/>';
    });
    s += txt(cx, cy - r - 6, "N", "rp-p", "middle") + txt(cx, cy + r + 14, "S", "rp-p", "middle") + txt(cx - r - 9, cy + 3, SW.t("O", "W"), "rp-p", "middle") + txt(cx + r + 9, cy + 3, "E", "rp-p", "middle");
    s += txt(988, 452, SW.t("TWS MIN/MOY/MAX", "TWS MIN/AVG/MAX"), "rp-l") + txt(988, 474, "0 / 11 / 21 kn", "rp-v");
    s += txt(988, 503, SW.t("TWD DOMINANT", "DOMINANT TWD"), "rp-l") + txt(988, 525, "N 346°", "rp-v");
    // les allures
    s += txt(x0, 700, SW.t("ALLURES", "POINTS OF SAIL"), "rp-l");
    var al = [[33, C.blue, SW.t("Près", "Upwind")], [57, C.accent, SW.t("Largue", "Reaching")], [10, C.amber, SW.t("Portant", "Downwind")]], ax = x0, lx = x0;
    al.forEach(function (a) {
      var w = 329 * a[0] / 100;
      s += '<rect x="' + ax.toFixed(1) + '" y="707" width="' + w.toFixed(1) + '" height="12" fill="' + a[1] + '"/>';
      s += '<rect x="' + lx + '" y="726" width="7" height="7" fill="' + a[1] + '"/>' + txt(lx + 11, 733, a[2] + " " + a[0] + "%", "rp-g");
      ax += w; lx += 74;
    });
    s += txt(mx, 776, "Sailaware · 28/09/2026", "rp-p") + txt(1114, 776, "1 / 3", "rp-p", "end");
    return '<svg viewBox="0 0 1160 820" aria-hidden="true">' + s + "</svg>";
  };

  // ── Le bloc « Mouillage — chasse » de l'écran Alarmes, déclenché (routes/alarms/blocks/AlarmAnchorBlock.tsx,
  //    components/AlarmBlockHeader.tsx, styles routes/alarms/alarms.css, textes i18n/locales/*/alarms.json).
  //    Le bateau est à 74 m de son point d'ancrage pour un rayon de 60 m : l'alarme sonne.
  M.mouillage = function () {
    var s = "", W = 560, x = 20, w = W - 40;
    s += '<style>.al-b{fill:color-mix(in srgb,var(--danger) 5%,var(--surface));stroke:color-mix(in srgb,var(--danger) 50%,var(--line))}' +
      '.al-t{font-family:var(--mono)}.al-nom{font:700 13px var(--mono);fill:var(--fg);letter-spacing:.06em}.al-desc{font:400 10.5px var(--sans);fill:var(--muted)}' +
      '.al-lab{font:700 9px var(--mono);fill:var(--dim);letter-spacing:.08em}.al-val{font:700 12px var(--mono);fill:var(--accent)}' +
      '.al-dist{font:700 20px var(--mono);fill:var(--danger)}.al-sec{font:400 10px var(--mono);fill:var(--dim)}.al-boite{fill:var(--surface-2);stroke:var(--line)}' +
      '.al-btn{font:600 10px var(--mono);fill:var(--fg);letter-spacing:.06em}.al-btn-acc{font:600 10px var(--mono);fill:var(--accent);letter-spacing:.06em}' +
      '.al-pied{font:400 9.5px var(--mono);fill:var(--dim)}.al-statut{font:700 9px var(--mono);fill:var(--danger);letter-spacing:.08em}</style>';
    s += '<rect x="' + x + '" y="16" width="' + w + '" height="362" rx="12" class="al-b"/>';
    // en-tête : l'icône d'ancre (Anchor de lucide) sur fond rouge pâle, le nom, la description, le statut, l'interrupteur
    s += '<rect x="40" y="34" width="32" height="32" rx="8" fill="color-mix(in srgb,var(--danger) 18%,transparent)"/>' +
      '<g transform="translate(56 50)" fill="none" stroke="var(--danger)" stroke-width="1.6" stroke-linecap="round"><circle cy="-5" r="2.2"/><path d="M0 -2.8V7M-4.5 1H4.5M-6.5 3a6.5 6 0 0 0 13 0"/></g>';
    s += '<text x="84" y="47" class="al-nom">' + SW.t("MOUILLAGE — CHASSE", "ANCHOR — DRAGGING") + "</text>";
    // la description revient à la ligne dans la colonne du titre, comme dans l'application
    s += '<text x="84" y="63" class="al-desc">' + SW.t("Alerte si la position s'écarte de plus de N mètres", "Alerts if the position drifts more than N metres") +
      '<tspan x="84" dy="13">' + SW.t("du point d'ancrage défini.", "from the defined anchor point.") + "</tspan></text>";
    s += '<rect x="418" y="38" width="76" height="20" rx="3" fill="color-mix(in srgb,var(--danger) 18%,transparent)"/><text x="456" y="52" text-anchor="middle" class="al-statut">' + SW.t("DÉCLENCHÉE", "TRIGGERED") + "</text>";
    s += '<rect x="504" y="40" width="30" height="16" rx="8" fill="color-mix(in srgb,var(--accent) 35%,var(--surface-2))"/><circle cx="526" cy="48" r="6" fill="var(--accent)"/>';
    s += '<line x1="40" y1="88" x2="' + (W - 40) + '" y2="88" stroke="var(--line)"/><g transform="translate(0 10)">';
    // la distance au point d'ancrage, en rouge : dehors du rayon
    s += '<rect x="40" y="92" width="' + (W - 80) + '" height="62" rx="8" class="al-boite"/>';
    s += '<text x="54" y="112" class="al-lab">' + SW.t("DISTANCE AU POINT D'ANCRAGE", "DISTANCE TO ANCHOR POINT") + "</text>";
    s += '<text x="54" y="140" class="al-dist">74 m</text>';
    s += '<text x="' + (W - 54) + '" y="140" text-anchor="end" class="al-sec">' + SW.t("Centre : 47°33.12'N · 002°54.80'W · rayon 60 m", "Centre: 47°33.12'N · 002°54.80'W · radius 60 m") + "</text>";
    // les deux réglages
    [[SW.t("RAYON MAX", "MAX RADIUS"), "60 m", .3], [SW.t("DURÉE MIN DE DÉPASSEMENT", "MIN OVERSHOOT DURATION"), "20 s", .17]].forEach(function (c, i) {
      var cx = 40 + i * 247, cw = 233;
      s += '<text x="' + cx + '" y="184" class="al-lab">' + c[0] + '</text><text x="' + (cx + cw) + '" y="184" text-anchor="end" class="al-val">' + c[1] + "</text>";
      s += '<rect x="' + cx + '" y="196" width="' + cw + '" height="4" rx="2" fill="var(--surface-2)"/><rect x="' + cx + '" y="196" width="' + (cw * c[2]) + '" height="4" rx="2" fill="color-mix(in srgb,var(--accent) 60%,var(--surface-2))"/>' +
        '<circle cx="' + (cx + cw * c[2]) + '" cy="198" r="7" fill="var(--accent)"/>';
    });
    // le son et le bouton Tester
    s += '<rect x="40" y="222" width="340" height="32" rx="6" class="al-boite"/><text x="54" y="242" class="al-sec" fill="var(--fg)" style="fill:var(--fg)">' + SW.t("Urgent (5 bips rapides)", "Urgent (5 fast beeps)") + '</text><path d="M362 235l5 5l5-5" fill="none" stroke="var(--dim)" stroke-width="1.4"/>';
    s += '<rect x="392" y="222" width="128" height="32" rx="6" class="al-boite"/><path d="M412 232v12l9-6z" fill="var(--muted)"/><text x="430" y="242" class="al-btn" style="fill:var(--muted)">' + SW.t("TESTER", "TEST") + "</text>";
    // le pied : la source et les trois actions
    s += '<line x1="40" y1="274" x2="' + (W - 40) + '" y2="274" stroke="var(--line)"/>';
    s += '<text x="40" y="294" class="al-pied">' + SW.t("Source GPS · son continu toutes les 2 s tant que dehors du rayon", "GPS source · continuous sound every 2 s while outside the radius") + "</text>";
    var bx = 40;
    [[SW.t("EFFACER", "CLEAR"), 84, ""], [SW.t("REDÉFINIR POSITION", "RESET POSITION"), 160, "acc"], [SW.t("ACQUITTER (MUTE 30 S)", "ACKNOWLEDGE (MUTE 30 S)"), 200, ""]].forEach(function (b) {
      s += '<rect x="' + bx + '" y="310" width="' + b[1] + '" height="34" rx="8" ' + (b[2] ? 'fill="color-mix(in srgb,var(--accent) 15%,var(--surface-2))" stroke="color-mix(in srgb,var(--accent) 40%,var(--line))"' : 'class="al-boite"') + "/>" +
        '<text x="' + (bx + b[1] / 2) + '" y="331" text-anchor="middle" class="' + (b[2] ? "al-btn-acc" : "al-btn") + '">' + b[0] + "</text>";
      bx += b[1] + 8;
    });
    return '<svg viewBox="0 0 ' + W + ' 394" aria-hidden="true">' + s + "</g></svg>";
  };

  // les maquettes animées se lancent une fois posées dans la page (une maquette d'un autre fichier s'y inscrit aussi)
  var ANIMATIONS = window.MAQUETTES_ANIMATIONS = window.MAQUETTES_ANIMATIONS || {};
  ANIMATIONS.meteo = animerMeteo;
  window.MAQUETTES_ANIMER = function (racine) {
    (racine || document).querySelectorAll("[data-anime]:not([data-lance])").forEach(function (b) {
      var f = ANIMATIONS[b.getAttribute("data-anime")];
      if (f) { b.setAttribute("data-lance", "1"); f(b); }
    });
  };
  // un cadre <figure data-maquette="<id>"> d'une page reçoit sa maquette, refaite au changement de langue
  function poser() {
    document.querySelectorAll("[data-maquette]").forEach(function (f) {
      var m = M[f.getAttribute("data-maquette")];
      if (m) { f.innerHTML = m(); window.MAQUETTES_ANIMER(f); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", poser); else setTimeout(poser, 0);
  document.addEventListener("langue", poser);
})();
