/* Maquette « quotidien » de la page Fonctionnalités : la première des neuf pages du guide de démarrage, comme
   l'application la dessine dans une fenêtre de 800 × 500 px (viewBox 16:10, un pixel de l'application par unité).
   Elle suit la langue et le thème du site : textes anglais de l'application en anglais, couleurs de nuit ou de jour.
   Relevé dans le code de l'application (packages/app/src) :
   · la barre du guide (logo de 22 px, titre en capitales, « Page 1 sur 9 », bouton « Quitter le guide ») et la page de
     présentation (logo de 56 px avec sa lueur, titre, texte, neuf points de progression, bouton « Suivant ») :
     routes/accueil/GuideRoute.tsx ; le nombre de pages : lib/accueil (PAGES_GUIDE) ;
   · le logo (carré d'accent, une coque et deux vagues, trait de 2,5) : components/LogoSailaware.tsx ;
   · les textes : i18n/locales/fr|en/accueil.json (guide.*, pages.bienvenue) ;
   · les couleurs : index.css (--color-bg, -surface-2, -border, -border-strong, -text, -text-muted, -accent,
     -sur-couleur, --shadow-glow ; nuit et jour), --tracking-wide 0,1 em ; police JetBrains Mono partout. */
(function () {
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  // retour à la ligne au mot (police à chasse fixe) ; 54 signes par ligne, comme sur la vraie capture du guide
  function lignes(t, max) {
    var mots = t.split(" "), out = [], cur = "";
    for (var i = 0; i < mots.length; i++) {
      var essai = cur ? cur + " " + mots[i] : mots[i];
      if (essai.length > max && cur) { out.push(cur); cur = mots[i]; } else cur = essai;
    }
    if (cur) out.push(cur);
    return out;
  }
  // le logo : un carré d'accent (rayon 4 px), le pictogramme à 54,5 % du côté
  function logo(x, y, c, lueur) {
    var p = Math.round(c * 0.545), k = p / 24, o = (c - p) / 2;
    return (lueur ? '<rect x="' + x + '" y="' + y + '" width="' + c + '" height="' + c + '" rx="4" class="mq-quotidien-lueur" filter="url(#mq-quotidien-flou)"/>' : "") +
      '<rect x="' + x + '" y="' + y + '" width="' + c + '" height="' + c + '" rx="4" class="mq-quotidien-accent"/>' +
      '<g transform="translate(' + (x + o) + " " + (y + o) + ") scale(" + k + ')" class="mq-quotidien-picto">' +
      '<path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1"/>' +
      '<path d="M4 18 2 6l10 6 10-6-2 12"/></g>';
  }

  window.MAQUETTES = window.MAQUETTES || {};
  window.MAQUETTES.quotidien = function () {
    var en = SW.lang() === "en", s = "";
    // la barre du guide : 48 px, filet dessous, 20 px de bord
    var titre = SW.t("Guide de démarrage", "Getting started"), quitter = SW.t("Quitter le guide", "Leave the guide");
    s += '<line x1="0" y1="47.5" x2="800" y2="47.5" class="mq-quotidien-filet"/>';
    s += logo(20, 13, 22, false);
    s += '<text x="54" y="28" class="mq-quotidien-barre">' + titre + "</text>";
    s += '<text x="' + (54 + titre.length * 7.7 + 12) + '" y="28" class="mq-quotidien-repere">' + SW.t("Page 1 sur 9", "Page 1 of 9") + "</text>";
    var wq = 12 + 14 + 6 + quitter.length * 7.7 + 12, xq = 780 - wq;
    s += '<rect x="' + (xq + 0.5) + '" y="9.5" width="' + wq + '" height="29" rx="6" class="mq-quotidien-bouton"/>';
    s += '<path d="M18 6 6 18M6 6l12 12" transform="translate(' + (xq + 12) + ' 17) scale(.5833)" class="mq-quotidien-x"/>';
    s += '<text x="' + (xq + 32) + '" y="28" class="mq-quotidien-quitter">' + quitter + "</text>";

    // la page : une colonne de 512 px au centre
    var x = 144, y = 106;
    s += logo(x, y, 56, true);
    s += '<text x="' + x + '" y="' + (y + 95) + '" class="mq-quotidien-titre">' + SW.t("Bienvenue à bord", "Welcome aboard") + "</text>";
    var l = lignes(SW.t("Sailaware vous aide à préparer et à suivre vos navigations : météo, routage, instruments et sécurité, sur une seule carte. En quelques pages, voici ce qu'il sait faire. Ensuite, nous créerons ensemble votre bateau, puis votre premier voyage.",
      "Sailaware helps you prepare and follow your passages: weather, routing, instruments and safety, all on one map. In a few pages, here is what it can do. Then we'll create your boat together, followed by your first voyage."), 54);
    s += '<text x="' + x + '" y="' + (y + 138) + '" class="mq-quotidien-texte">';
    for (var i = 0; i < l.length; i++) s += '<tspan x="' + x + '"' + (i ? ' dy="26"' : "") + ">" + esc(l[i]) + "</tspan>";
    s += "</text>";
    // les neuf points : le premier long et plein, les autres ronds
    var yp = y + 120 + l.length * 26 + 24, xp = x;
    for (var j = 0; j < 9; j++) {
      var w = j === 0 ? 20 : 6;
      s += '<rect x="' + xp + '" y="' + yp + '" width="' + w + '" height="6" rx="3" class="' + (j === 0 ? "mq-quotidien-accent" : "mq-quotidien-point") + '"/>';
      xp += w + 6;
    }
    // « Suivant », à droite de la colonne
    var suivant = SW.t("Suivant", "Next"), wb = 16 + suivant.length * 8.4 + 6 + 14 + 16, yb = yp + 30;
    s += '<rect x="' + (656 - wb) + '" y="' + yb + '" width="' + wb + '" height="32" rx="6" class="mq-quotidien-accent"/>';
    s += '<text x="' + (656 - wb + 16) + '" y="' + (yb + 20.5) + '" class="mq-quotidien-suivant">' + suivant + "</text>";
    s += '<path d="M5 12h14M12 5l7 7-7 7" transform="translate(' + (656 - 16 - 14) + " " + (yb + 9) + ') scale(.5833)" class="mq-quotidien-fleche"/>';

    return '<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" class="mq-quotidien" aria-hidden="true">' +
      "<style>" +
      // les quelques couleurs de l'application que le site n'a pas sous le même nom (index.css, nuit puis jour)
      ".mq-quotidien{--mq-quotidien-bord-fort:rgb(190 242 100 / .22);--mq-quotidien-lueur:rgb(190 242 100 / .35)}" +
      ':root[data-theme="light"] .mq-quotidien{--mq-quotidien-bord-fort:rgb(14 24 34 / .18);--mq-quotidien-lueur:rgb(77 124 15 / .22)}' +
      '@media (prefers-color-scheme: light){:root:not([data-theme="dark"]) .mq-quotidien{--mq-quotidien-bord-fort:rgb(14 24 34 / .18);--mq-quotidien-lueur:rgb(77 124 15 / .22)}}' +
      ".mq-quotidien text{font-family:var(--mono)}" +
      ".mq-quotidien-fond{fill:var(--bg)}" +
      ".mq-quotidien-filet{stroke:var(--line)}" +
      ".mq-quotidien-accent{fill:var(--accent)}" +
      ".mq-quotidien-lueur{fill:var(--mq-quotidien-lueur)}" +
      ".mq-quotidien-picto{fill:none;stroke:var(--on-accent);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}" +
      ".mq-quotidien-barre{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;fill:var(--fg)}" +
      ".mq-quotidien-repere{font-size:12px;fill:var(--muted)}" +
      ".mq-quotidien-bouton{fill:var(--surface-2);stroke:var(--line)}" +
      ".mq-quotidien-x{fill:none;stroke:var(--fg);stroke-width:2;stroke-linecap:round}" +
      ".mq-quotidien-quitter{font-size:11px;letter-spacing:.1em;text-transform:uppercase;fill:var(--fg)}" +
      ".mq-quotidien-titre{font-size:24px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;fill:var(--fg)}" +
      ".mq-quotidien-texte{font-size:16px;fill:var(--muted)}" +
      ".mq-quotidien-point{fill:var(--mq-quotidien-bord-fort)}" +
      ".mq-quotidien-suivant{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;fill:var(--on-accent)}" +
      ".mq-quotidien-fleche{fill:none;stroke:var(--on-accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
      "</style>" +
      // la lueur du logo : --shadow-glow (0 0 20px la nuit, 0 0 14px le jour), rendue par un flou
      '<defs><filter id="mq-quotidien-flou" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>' +
      '<rect x="0" y="0" width="800" height="500" class="mq-quotidien-fond"/>' + s + "</svg>";
  };
})();
