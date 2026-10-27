/* L'éventail animé (isochrones puis route), les toiles fixes et les instruments — communs à l'accueil, Offshore, Coastal
   et Le routage. Repris des maquettes (essais/n523/site), traduit : textes par SW.t, refaits sur « langue » et « theme ». */
(function () {
  // les deux scènes : vraie côte GSHHS f, champ des temps calculé hors de la page (essais/n523/site/scene.py : grille,
  // 16 voisins, polaire simple, vent constant, sans courant), isochrones = lignes de niveau ; ici on les dessine un à un
  var SC = window.SCENES;
  var ORDRE = ["morbihan", "corfou", "new-york", "papeete"].filter(function (n) { return SC[n] && document.getElementById("o-" + n); });
  var INFO = {
    morbihan: { t: ["Sortir du golfe et contourner une marque", "Leave the gulf and round a mark"],
      p: ["Les isochrones partent dans toutes les directions et se faufilent entre les îles. La route sort par le goulet, laisse la marque rouge à bâbord sans s'y coller, puis file au plus rapide vers Belle-Île. En vert : les fronts qui ont passé la marque.",
          "The isochrones spread out in every direction and slip between the islands. The route leaves through the narrows, keeps the red mark to port without hugging it, then heads at best speed for Belle-Île. In green: the fronts that have passed the mark."] },
    corfou: { t: ["Passer les détroits", "Through the straits"],
      p: ["Bonifacio, Messine, puis l'Adriatique : la route la plus rapide se glisse entre les îles et les caps jusqu'aux îles croates.",
          "Bonifacio, Messina, then the Adriatic: the fastest route slips between the islands and headlands all the way to the Croatian islands."] },
    "new-york": { t: ["Aller chercher le vent", "Going for the wind"],
      p: ["Pour traverser au plus rapide, la route monte jusqu'à 60° nord avant de redescendre vers l'Amérique.",
          "To cross as fast as possible, the route climbs to 60° north before coming back down to America."] },
    papeete: { t: ["Traverser un océan", "Crossing an ocean"],
      p: ["De la Nouvelle-Zélande à Tahiti, 2 140 milles : les isochrones s'enroulent autour des archipels et la route trouve son passage.",
          "From New Zealand to Tahiti, 2,140 miles: the isochrones wrap around the archipelagos and the route finds its way through."] }
  };
  function info(n, k) { return SW.t(INFO[n][k][0], INFO[n][k][1]); }
  function source(S) {
    return S.reel ? SW.t("Vraie route et vrais isochrones de Sailaware (profil Aperçu, météo enregistrée du banc d'essai), complétés pour l'illustration là où le calcul ne s'étend pas · arrivée en ",
                         "Real Sailaware route and isochrones (Overview profile, recorded weather from the test bench), filled in for the illustration where the computation does not reach · arrival in ") + Math.round(S.arrivee_h) + " h."
      : SW.t("Vraie côte · calcul simplifié pour l'illustration : polaire simple, vent constant, sans courant.",
             "Real coastline · simplified computation for the illustration: simple polar, constant wind, no current.");
  }
  // une page sans éventail (Le routage) garde les toiles fixes : on dessine alors sur une toile de travail
  var cv = document.getElementById("eventail") || document.createElement("canvas"), g = cv.getContext("2d");
  var W = 600, H = 400, R = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  cv.width = W * R; cv.height = H * R;
  function couleur(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function chemin(f, ferme) { g.beginPath(); for (var i = 0; i < f.length; i += 2) { if (i) g.lineTo(f[i], f[i + 1]); else g.moveTo(f[i], f[i + 1]); } if (ferme) g.closePath(); }
  function duree(h) { var m = Math.round(h * 60), hh = Math.floor(m / 60), mm = m % 60; return "+" + (h < 10 ? hh + " h " + (mm < 10 ? "0" : "") + mm : hh + " h"); }
  function dessiner(nom, nf, fr) {
    var S = SC[nom], N = S.fronts.length;
    // les couleurs de la carte de l'application, jour comme nuit : fond Positron par défaut, isochrones noires
    // (layers/navawayLiveIso.ts), route active rouge à halo blanc, départ vert et arrivée rouge (layers/routagesLayers.ts)
    var c = { sea: "#C2C8CA", iso: "#000", route: "#C0392B", land: "#F2F3F0", coast: "#d6d8d3",
              fg: "#2b2f33", dim: "#6b7075", surface: "#ffffff", mono: couleur("--mono") };
    g.setTransform(R, 0, 0, R, 0, 0);
    g.fillStyle = c.sea; g.fillRect(0, 0, W, H);
    g.setTransform(R * W / S.W, 0, 0, R * H / S.H, 0, 0);
    g.lineJoin = "round"; g.lineCap = "round";
    for (var i = 0; i < nf; i++) {
      var neuf = i === nf - 1 && nf < N;
      g.strokeStyle = c.iso; g.globalAlpha = neuf ? .9 : .55; g.lineWidth = neuf ? 1.5 : 1;
      S.fronts[i].l.forEach(function (l) { chemin(l, false); g.stroke(); });
      if (S.fronts[i].l2) { g.strokeStyle = c.route; S.fronts[i].l2.forEach(function (l) { chemin(l, false); g.stroke(); }); }
    }
    g.globalAlpha = 1;
    g.fillStyle = c.land; g.strokeStyle = c.coast; g.lineWidth = .6;
    S.terre.forEach(function (p) { chemin(p, true); g.fill(); g.stroke(); });
    g.font = "500 11px " + c.mono; g.textAlign = "center"; g.fillStyle = c.dim;
    S.noms.forEach(function (n) { g.fillText(n.t, n.x, n.y); });
    (S.marques || []).forEach(function (m) {  // marque latérale bâbord : un « can » rouge
      g.fillStyle = "#dc2626"; g.strokeStyle = c.fg; g.lineWidth = 1;
      g.fillRect(m.x - 4.5, m.y - 6, 9, 12); g.strokeRect(m.x - 4.5, m.y - 6, 9, 12);
      g.fillStyle = c.fg; g.font = "600 11px " + c.mono; g.textAlign = "left"; g.fillText(SW.t("marque à bâbord", "mark to port"), m.x + 9, m.y + 4);
      g.fillStyle = c.dim; g.textAlign = "center";
    });
    if (fr > 0) {
      var r = S.route, lg = [], tot = 0;
      for (var k = 2; k < r.length; k += 2) { var d = Math.hypot(r[k] - r[k - 2], r[k + 1] - r[k - 1]); lg.push(d); tot += d; }
      var reste = tot * fr; g.beginPath(); g.moveTo(r[0], r[1]);
      for (k = 2; k < r.length && reste > 0; k += 2) {
        var u = Math.min(1, reste / lg[k / 2 - 1]);
        g.lineTo(r[k - 2] + u * (r[k] - r[k - 2]), r[k - 1] + u * (r[k + 1] - r[k - 1])); reste -= lg[k / 2 - 1];
      }
      g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 6; g.stroke();
      g.strokeStyle = c.route; g.lineWidth = 3; g.stroke();
    }
    g.lineWidth = 2; g.strokeStyle = "#fff";
    g.fillStyle = "#2ECC71"; g.beginPath(); g.arc(S.dep[0], S.dep[1], 6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = "#E74C3C"; g.beginPath(); g.arc(S.arr[0], S.arr[1], 6, 0, 7); g.fill(); g.stroke();
    // le vent (flèche dans le sens où il souffle) et l'heure du dernier front
    g.setTransform(R, 0, 0, R, 0, 0);
    if (S.vent !== null && S.vent !== undefined) {
      var b = (S.vent + 180) * Math.PI / 180, cx = 30, cy = 30, ux = Math.sin(b), uy = -Math.cos(b);
      g.strokeStyle = c.fg; g.fillStyle = c.fg; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cx - 11 * ux, cy - 11 * uy); g.lineTo(cx + 11 * ux, cy + 11 * uy); g.stroke();
      g.beginPath(); g.moveTo(cx + 13 * ux, cy + 13 * uy); g.lineTo(cx + 5 * ux - 5 * uy, cy + 5 * uy + 5 * ux); g.lineTo(cx + 5 * ux + 5 * uy, cy + 5 * uy - 5 * ux); g.closePath(); g.fill();
      g.font = "600 11px " + c.mono; g.textAlign = "left"; g.fillText(SW.t("14 nds", "14 kn"), 48, 34);
    }
    var tf = S.fronts[Math.max(0, nf - 1)].t;
    if (fr < 1 && (tf === null || tf === undefined)) return;
    var h = fr >= 1 ? S.arrivee_h : tf, txt = fr >= 1 ? SW.t("arrivée ", "arrival ") + duree(h) : duree(h);
    g.font = "600 13px " + c.mono; var tw = g.measureText(txt).width;
    g.globalAlpha = .85; g.fillStyle = c.surface; g.fillRect(W - tw - 26, 14, tw + 14, 24); g.globalAlpha = 1;
    g.fillStyle = fr >= 1 ? c.route : c.fg; g.textAlign = "right"; g.fillText(txt, W - 19, 31);
  }
  var cur = 0, t0 = null, F = 210, RT = 1500, TENUE = 2800;
  var onglets = ORDRE.map(function (n) { return document.getElementById("o-" + n); });
  function montrer(i) {
    cur = i; t0 = null;
    onglets.forEach(function (o, k) { o.setAttribute("aria-selected", k === i ? "true" : "false"); });
    legende();
  }
  function legende() {
    if (!ORDRE.length) return;
    document.getElementById("leg-t").textContent = info(ORDRE[cur], "t");
    document.getElementById("leg-p").textContent = info(ORDRE[cur], "p");
    document.getElementById("leg-s").textContent = source(SC[ORDRE[cur]]);
  }
  // v8 — une scène dessinée en entier sur une autre toile (vignettes des portes, fond des instruments)
  function dessinerSur(toile, nom) {
    if (!toile || !SC[nom]) return;
    toile.width = W * R; toile.height = H * R;
    var garde = g; g = toile.getContext("2d");
    dessiner(nom, SC[nom].fronts.length, 1);
    g = garde;
  }
  function fixes() {
    document.querySelectorAll("canvas.vignette").forEach(function (c) { dessinerSur(c, c.getAttribute("data-scene")); });
    var fondI = document.getElementById("fond-instr");
    if (fondI) dessinerSur(fondI, fondI.getAttribute("data-scene") || "corfou");
  }
  fixes();

  // v8 — les instruments, redessinés d'après InstrumentsGraphiques.tsx (cadrans de 192, Polaire de 240)
  // et index.css (nuit, teinte « lagon » N+515) ; valeurs d'exemple qui respirent
  var calmeI = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function () {
    var plateau = document.getElementById("plateau"), ecran = document.getElementById("ecran-instr");
    if (!plateau) return;
    var CW = 80, CH = 86, SVG = "http://www.w3.org/2000/svg";
    function pa(c, r, d) { var a = d * Math.PI / 180; return [c + r * Math.sin(a), c - r * Math.cos(a)]; }
    function pt(p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }
    function arc(c, r, a0, a1) { var p = pa(c, r, a0), q = pa(c, r, a1); return "M" + pt(p) + " A" + r + " " + r + " 0 0 1 " + pt(q); }
    var ZONES = [[0, 32, "var(--rouge)"], [32, 40, "var(--ambre)"], [40, 62, "var(--vert)"], [62, 138, "var(--s3)"], [138, 168, "var(--vert)"], [168, 180, "var(--ambre)"]];
    function graduations(c, r0, rl, rc, pas, chiffres, taille) {
      var s = "";
      for (var d = 0; d < 360; d += 10) { var lg = d % 30 === 0, a = pa(c, r0, d), b = pa(c, lg ? rl : rl + 4, d); s += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="var(--tdim)" stroke-width="' + (lg ? 1.6 : 1) + '"/>'; }
      chiffres.forEach(function (d) { var p = pa(c, rc, d); s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + taille * .32).toFixed(1) + '" text-anchor="middle" fill="var(--tdim)" font-size="' + taille + '">' + Math.abs(d) + '</text>'; });
      return s;
    }
    function aiguilleVent(id, coul, lettre) {
      return '<g data-aig="' + id + '" fill="' + coul + '"><polygon/><circle r="8.5"/><text text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--s1)">' + lettre + '</text></g>';
    }
    function poserAiguilleVent(gr, a) {
      gr.querySelector("polygon").setAttribute("points", [pa(96, 73, a), pa(96, 4, a + 90), pa(96, 16, a + 180), pa(96, 4, a - 90)].map(pt).join(" "));
      var t = pa(96, 57, a); gr.querySelector("circle").setAttribute("cx", t[0]); gr.querySelector("circle").setAttribute("cy", t[1]);
      gr.querySelector("text").setAttribute("x", t[0]); gr.querySelector("text").setAttribute("y", t[1] + 4.25);
    }
    function cadranVent() {
      var s = '<svg viewBox="0 0 192 192" width="106" height="106"><circle cx="96" cy="96" r="84" fill="var(--s2)" stroke="rgb(244 244 245 / .25)"/>';
      ZONES.forEach(function (z) { s += '<path d="' + arc(96, 79, z[0], z[1]) + '" fill="none" stroke="' + z[2] + '" stroke-width="6"/><path d="' + arc(96, 79, -z[1], -z[0]) + '" fill="none" stroke="' + z[2] + '" stroke-width="6"/>'; });
      [42, -42, 150, -150].forEach(function (a) { s += '<polygon fill="var(--mag)" points="' + [pa(96, 85, a), pa(96, 94, a - 3.6), pa(96, 94, a + 3.6)].map(pt).join(" ") + '"/>'; });
      s += graduations(96, 75, 67, 57, 30, [0, 30, 60, 90, 120, 150, 180, -30, -60, -90, -120, -150], 13);
      return s + aiguilleVent("awa", "var(--app)", "A") + aiguilleVent("twa", "var(--acc)", "V") + '<circle cx="96" cy="96" r="5" fill="var(--tx)"/></svg>';
    }
    function cadranCap() {
      var s = '<svg viewBox="0 0 192 192" width="106" height="106"><circle cx="96" cy="96" r="84" fill="var(--s2)" stroke="rgb(244 244 245 / .25)"/>';
      s += graduations(96, 80, 72, 60, 30, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330], 14);
      s += '<polygon data-aig="cog" fill="none" stroke="var(--val)" stroke-width="2" stroke-linejoin="round"/>';
      s += '<polygon data-aig="hdg" fill="var(--acc)"/><circle cx="96" cy="96" r="5" fill="var(--tx)"/>';
      return s + '<text x="96" y="124" text-anchor="middle" fill="var(--tdim)" font-size="13" data-en="true">vrai</text></svg>';
    }
    // la polaire d'exemple : rien sous 32°, plein vers 110°, un peu moins au portant (nœuds)
    function vPol(a) { a = Math.abs(a); if (a < 32) return 0; var v = 9 * Math.sin(Math.min(1, (a - 32) / 78) * Math.PI / 2); return a > 115 ? v * (1 - .2 * (a - 115) / 65) : v; }
    function cadranPolaire() {
      var c = 130, k = 86 / 9, s = '<svg viewBox="16 16 228 228" width="150" height="150"><circle cx="130" cy="130" r="100" fill="var(--s2)" stroke="rgb(244 244 245 / .25)"/>';
      [3, 6, 9].forEach(function (n) { s += '<circle cx="130" cy="130" r="' + (n * k).toFixed(1) + '" fill="none" stroke="rgb(244 244 245 / .22)" stroke-dasharray="2 3"/>'; });
      s += '<text x="134" y="' + (130 - 9 * k + 14).toFixed(1) + '" fill="var(--tdim)" font-size="14" data-en="9 kn">9 nds</text>';
      var dr = [], ga = [];
      for (var a = 32; a <= 180; a += 3) { dr.push(pt(pa(c, vPol(a) * k, a))); ga.unshift(pt(pa(c, vPol(a) * k, -a))); }
      s += '<polyline points="' + ga.concat(dr).join(" ") + '" fill="none" stroke="var(--int)" stroke-width="3" stroke-linejoin="round"/>';
      s += '<polygon fill="var(--val)" points="' + [pa(c, 112, 0), pa(c, 124, -4), pa(c, 124, 4)].map(pt).join(" ") + '"/>';
      s += '<polygon data-aig="suivre" fill="var(--mag)"/>';
      s += '<line data-aig="reel" stroke="var(--acc)" stroke-width="4.5" stroke-linecap="round"/><circle data-aig="pol" r="6" fill="none" stroke="var(--acc)" stroke-width="3"/><circle data-aig="stw" r="4.5" fill="var(--acc)"/>';
      return s + '<circle cx="130" cy="130" r="5" fill="var(--tx)"/></svg>';
    }
    function tendance(id, coul) {
      return '<svg data-tend="' + id + '" viewBox="0 0 100 32" width="70" height="30" preserveAspectRatio="none"><line x1="0" y1="16" x2="100" y2="16" stroke="rgb(244 244 245 / .12)"/><polygon fill="' + coul + '" opacity=".18"/><polyline fill="none" stroke="' + coul + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/><circle r="2.6" fill="' + coul + '"/></svg>';
    }
    var I = {
      polaire: { w: 4, h: 2, html: '<div class="milieu" style="top:4px;justify-content:space-between;gap:8px;padding-left:2px">' + cadranPolaire() +
        '<div style="display:grid;gap:8px;flex:1"><div class="boite active"><span class="int">HDG m</span><span class="val"><span data-v="hdgm"></span>°</span></div>' +
        '<div class="boite"><span class="int">TWA</span><span class="val"><span data-v="twa"></span><small>° T</small></span></div></div></div>' },
      vent: { w: 2, h: 2, html: '<div class="milieu" style="top:3px;bottom:auto;height:110px">' + cadranVent() + '</div><div class="bas2" style="position:absolute;left:5px;right:5px;bottom:5px">' +
        '<div><span class="int">TWS</span><span class="val" data-v="tws"></span></div><div><span class="int"><i style="background:var(--acc)"></i>TWA</span><span class="val"><span data-v="twa"></span>°</span></div></div>' },
      cap: { w: 2, h: 2, html: '<div class="milieu" style="top:3px;bottom:auto;height:110px">' + cadranCap() + '</div><div class="bas2" style="position:absolute;left:5px;right:5px;bottom:5px">' +
        '<div><span class="int"><i style="background:var(--acc)"></i>HDG v</span><span class="val"><span data-v="hdg"></span>°</span></div><div><span class="int">COG v</span><span class="val"><span data-v="cog"></span>°</span></div></div>' },
      vbateau: { w: 2, h: 1, html: '<span class="int" data-en="Boat speed">V. bateau</span><span class="duree">1 h</span><div class="milieu" style="justify-content:space-between;top:22px"><span class="val"><span data-v="stw"></span><small>kts</small></span>' + tendance("stw", "var(--val)") + '</div>' },
      perf: { w: 2, h: 1, html: '<span class="int">Perf.</span><span class="duree">1 h</span><div class="milieu" style="justify-content:space-between;top:22px"><span class="val perf-haut"><span data-v="perf"></span><small>%</small></span>' + tendance("perf", "var(--vert)") + '</div>' },
      effbarre: { w: 2, h: 1, html: '<span class="int" style="font-size:9px" data-en="Polar efficiency">Efficacité polaire</span><span class="val perf-haut" style="position:absolute;right:7px;top:4px;font-size:14px"><span data-v="perf"></span><small>%</small></span>' +
        '<div style="position:absolute;left:8px;right:8px;top:34px"><div style="position:relative;height:13px;border-radius:99px;background:linear-gradient(90deg,var(--rouge) 0%,var(--rouge) 30%,var(--ambre) 50%,var(--vert) 70%,var(--vert) 100%)"><b data-v="curseur" style="position:absolute;top:-4px;bottom:-4px;width:4px;margin-left:-2px;border-radius:2px;background:var(--tx);box-shadow:0 0 0 1.5px var(--s1)"></b></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:5px;color:var(--int);font-size:9.5px"><span>50</span><span>75</span><span>100</span></div></div>' },
      arrivee: { w: 1, h: 1, html: '<span class="int" data-en="Arrival">Arrivée</span><div class="milieu" style="flex-direction:column;top:20px"><span class="val" style="font-size:19px">06:40</span><span style="font-size:10px;color:var(--int);font-weight:600" data-en="D+1">J+1</span></div>' },
      capsuivre: { w: 2, h: 1, html: '<span class="int"><i style="background:var(--mag);border-radius:0;transform:rotate(45deg)"></i><span data-en="Course to steer">Cap à suivre</span></span><div class="milieu" style="top:20px"><span class="val"><span data-v="suivre"></span>°<small>m</small></span></div>' },
      press: { w: 1, h: 1, html: '<span class="int">Press.</span><div class="milieu" style="top:20px"><span class="val" style="font-size:17px">1015<small>hPa</small></span></div>' },
      temp: { w: 1, h: 1, html: '<span class="int">Temp.</span><div class="milieu" style="top:20px"><span class="val" style="font-size:18px" data-en="13.0<small>°C</small>">13,0<small>°C</small></span></div>' },
      profondeur: { w: 2, h: 1, html: '<span class="int" data-en="≋ Depth">≋ Profondeur</span><div class="milieu" style="top:18px;justify-content:space-between;gap:8px"><span class="val" style="font-size:19px"><span data-v="prof"></span><small>m</small></span>' +
        '<div style="flex:1;max-width:84px"><div style="display:flex;height:9px;border-radius:3px;overflow:hidden"><i style="flex:5;background:var(--rouge)"></i><i style="flex:5;background:var(--orange)"></i><i style="flex:10;background:var(--ambre)"></i><i style="flex:10;background:var(--vert)"></i></div>' +
        '<div style="display:flex;justify-content:space-between;color:var(--int);font-size:9px;margin-top:3px"><span>0</span><span>5</span><span>10</span><span>20</span><span>30</span></div></div></div>' }
    };
    var DISP = {
      traversee: { polaire: [0, 0], vent: [0, 2], cap: [2, 2], vbateau: [8, 0], perf: [8, 1], effbarre: [8, 2], arrivee: [8, 3], press: [9, 3], capsuivre: [8, 4] },
      cotier: { profondeur: [0, 0], capsuivre: [0, 1], vbateau: [0, 2], arrivee: [0, 3], temp: [1, 3], vent: [8, 0], cap: [8, 2], effbarre: [8, 4] },
      minimal: { vent: [0, 0], capsuivre: [0, 2], vbateau: [8, 0], arrivee: [9, 1] }
    };
    var cartes = {};
    Object.keys(I).forEach(function (id) {
      var d = document.createElement("div"); d.className = "ic"; d.innerHTML = I[id].html; d.setAttribute("data-cache", ""); d.style.transition = "none";
      d.style.width = (I[id].w * CW - 8) + "px"; d.style.height = (I[id].h * CH - 8) + "px";
      plateau.appendChild(d); cartes[id] = d;
    });
    var frise = document.createElement("div"); frise.className = "frise";
    frise.innerHTML = "<span>18:00</span><span class=\"piste\"><b></b><u></u></span><span data-en=\"D+1 06:40\">J+1 06:40</span>"; plateau.appendChild(frise);
    var courante = "traversee";
    function disposer(nom) {
      courante = nom;
      Object.keys(cartes).forEach(function (id) {
        var p = DISP[nom][id], d = cartes[id];
        if (p) { d.style.left = (p[0] * CW + 4) + "px"; d.style.top = (p[1] * CH + 4) + "px"; d.removeAttribute("data-cache"); }
        else d.setAttribute("data-cache", "");
      });
      document.querySelectorAll(".dispositions button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-disp") === nom ? "true" : "false"); });
    }
    function echelle() { plateau.style.transform = "scale(" + (ecran.clientWidth / 800) + ")"; }
    window.addEventListener("resize", echelle); echelle(); disposer(plateau.getAttribute("data-fixe") || "traversee");
    // les cartes naissent à leur place, sans fondu ; les mouvements suivants sont animés
    requestAnimationFrame(function () { requestAnimationFrame(function () { Object.keys(cartes).forEach(function (id) { cartes[id].style.transition = ""; }); }); });
    // les valeurs : une navigation d'exemple au portant, qui respire doucement
    var hist = { stw: [], perf: [] }, t = 0;
    function maj() {
      t += 1;
      var twa = 128 + 6 * Math.sin(t / 7), tws = 16.4 + 1.1 * Math.sin(t / 5 + 1), hdg = 151 + 4 * Math.sin(t / 9), cog = hdg - 3 + Math.sin(t / 4);
      var perf = 96 + 2.4 * Math.sin(t / 6), stw = vPol(twa) * perf / 100, awa = twa - 24 - 3 * Math.sin(t / 7);
      var V = { twa: Math.round(twa), tws: SW.n(tws, 1), hdg: ("00" + Math.round(hdg)).slice(-3), hdgm: ("00" + Math.round(hdg + 2)).slice(-3),
        cog: ("00" + Math.round(cog)).slice(-3), stw: SW.n(stw, 1), perf: Math.round(perf), suivre: "156", prof: SW.n(12.4 + .3 * Math.sin(t / 8), 1) };
      plateau.querySelectorAll("[data-v]").forEach(function (e) {
        var k = e.getAttribute("data-v");
        if (k === "curseur") e.style.left = Math.max(0, Math.min(100, (perf - 50) * 2)) + "%"; else e.textContent = V[k];
      });
      plateau.querySelectorAll('[data-aig="twa"]').forEach(function (e) { poserAiguilleVent(e, twa); });
      plateau.querySelectorAll('[data-aig="awa"]').forEach(function (e) { poserAiguilleVent(e, awa); });
      var h = plateau.querySelector('[data-aig="hdg"]'); if (h) h.setAttribute("points", [pa(96, 72, hdg), pa(96, 5, hdg + 90), pa(96, 14, hdg + 180), pa(96, 5, hdg - 90)].map(pt).join(" "));
      var cg = plateau.querySelector('[data-aig="cog"]'); if (cg) cg.setAttribute("points", [pa(96, 74, cog), pa(96, 86, cog - 5), pa(96, 86, cog + 5)].map(pt).join(" "));
      var k = 86 / 9, r = plateau.querySelector('[data-aig="reel"]'), pr = pa(130, stw * k, twa), pp = pa(130, vPol(twa) * k, twa);
      if (r) { r.setAttribute("x1", 130); r.setAttribute("y1", 130); r.setAttribute("x2", pr[0]); r.setAttribute("y2", pr[1]); }
      var po = plateau.querySelector('[data-aig="pol"]'); if (po) { po.setAttribute("cx", pp[0]); po.setAttribute("cy", pp[1]); }
      var sw = plateau.querySelector('[data-aig="stw"]'); if (sw) { sw.setAttribute("cx", pr[0]); sw.setAttribute("cy", pr[1]); }
      var su = plateau.querySelector('[data-aig="suivre"]'), as = 133; if (su) su.setAttribute("points", [pa(130, 101, as), pa(130, 113, as - 4), pa(130, 113, as + 4)].map(pt).join(" "));
      hist.stw.push(stw); hist.perf.push(perf); if (hist.stw.length > 40) { hist.stw.shift(); hist.perf.shift(); }
      ["stw", "perf"].forEach(function (id) {
        var sv = plateau.querySelector('[data-tend="' + id + '"]'), L = hist[id], lo = Math.min.apply(null, L) - .3, hi = Math.max.apply(null, L) + .3;
        var P = L.map(function (v, i) { return [i * 100 / 39 + (40 - L.length) * 100 / 39, 30 - (v - lo) / (hi - lo) * 28]; });
        sv.querySelector("polyline").setAttribute("points", P.map(pt).join(" "));
        sv.querySelector("polygon").setAttribute("points", P.map(pt).join(" ") + " " + P[P.length - 1][0].toFixed(1) + ",32 " + P[0][0].toFixed(1) + ",32");
        var dn = P[P.length - 1]; sv.querySelector("circle").setAttribute("cx", dn[0]); sv.querySelector("circle").setAttribute("cy", dn[1]);
      });
    }
    for (var i = 0; i < 40; i++) maj();
    var auto = !calmeI && !plateau.getAttribute("data-fixe"), ordre = ["traversee", "cotier", "minimal"];
    document.querySelectorAll(".dispositions button").forEach(function (b) {
      b.addEventListener("click", function () { auto = false; disposer(b.getAttribute("data-disp")); });
    });
    if (calmeI) return;
    setInterval(maj, 1000);
    setInterval(function () { if (auto) disposer(ordre[(ordre.indexOf(courante) + 1) % ordre.length]); }, 5000);
  })();

  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // la langue ou le thème changent : on refait les textes et les dessins fixes (l'éventail se redessine à chaque image)
  function refaire() { legende(); fixes(); if (calme && ORDRE.length) dessiner(ORDRE[cur], SC[ORDRE[cur]].fronts.length, 1); }
  document.addEventListener("langue", refaire);
  document.addEventListener("theme", refaire);
  if (!ORDRE.length) return;
  montrer(0);
  dessiner(ORDRE[0], SC[ORDRE[0]].fronts.length, 1);
  onglets.forEach(function (o, k) {
    o.addEventListener("click", function () { montrer(k); if (calme) dessiner(ORDRE[k], SC[ORDRE[k]].fronts.length, 1); });
  });
  if (calme) return;
  function boucle(t) {
    if (t0 === null) t0 = t;
    // la route part quand un front atteint l'arrivée ; les fronts continuent de s'étendre autour (cadre couvert)
    var S = SC[ORDRE[cur]], N = S.fronts.length, FS = Math.min(F, 6500 / N), e = t - t0;
    var nf = Math.min(N, Math.floor(e / FS) + 1), na = (S.n_arrivee === undefined ? N - 1 : S.n_arrivee) + 1;
    var fr = Math.max(0, Math.min(1, (e - na * FS) / RT));
    dessiner(ORDRE[cur], nf, fr);
    if (e > Math.max(N * FS, na * FS + RT) + TENUE) montrer((cur + 1) % ORDRE.length);
    requestAnimationFrame(boucle);
  }
  setTimeout(function () { t0 = null; requestAnimationFrame(boucle); }, 1500);
})();
