/* ResidenceWatch : spelling variants of Armenian surnames.
   Entrée : un nom en alphabet latin, cyrillique ou arménien. Sortie : écritures probables, chacune avec ses raisons.
   L'écriture arménienne passe par la bibliothèque armenian-transliteration (licence ISC) quand elle est chargée. */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------- lecture en « phonèmes »
  const LATIN_TOKENS = [
    ["tsch", "CH"], ["dsch", "J"], ["tch", "CH"], ["dzh", "J"], ["sch", "SH"],
    ["kh", "KH"], ["gh", "GH"], ["ts", "TS"], ["tz", "TS"], ["dz", "DZ"], ["ch", "CH"], ["sh", "SH"], ["zh", "ZH"],
    ["dj", "J"], ["ou", "U"], ["oo", "U"], ["ph", "P"], ["th", "T"], ["yu", "YU"], ["yo", "YO"], ["ju", "YU"],
    ["a", "A"], ["e", "E"], ["i", "I"], ["o", "O"], ["u", "U"], ["y", "Y"], ["é", "E"], ["è", "E"], ["ë", "E"],
    ["b", "B"], ["p", "P"], ["d", "D"], ["t", "T"], ["g", "G"], ["k", "K"], ["q", "K"], ["c", "TS"],
    ["v", "V"], ["w", "V"], ["f", "F"], ["h", "H"], ["x", "KH"], ["j", "J"], ["l", "L"], ["m", "M"],
    ["n", "N"], ["r", "R"], ["s", "S"], ["z", "Z"], ["ç", "CH"], ["ş", "SH"], ["ž", "ZH"], ["š", "SH"], ["č", "CH"]
  ];
  const CYR_TOKENS = [
    ["дж", "J"], ["дз", "DZ"], ["а", "A"], ["б", "B"], ["в", "V"], ["г", "G"], ["д", "D"], ["е", "E"], ["ё", "YO"],
    ["ж", "ZH"], ["з", "Z"], ["и", "I"], ["й", "Y"], ["к", "K"], ["л", "L"], ["м", "M"], ["н", "N"], ["о", "O"],
    ["п", "P"], ["р", "R"], ["с", "S"], ["т", "T"], ["у", "U"], ["ф", "F"], ["х", "KH"], ["ц", "TS"], ["ч", "CH"],
    ["ш", "SH"], ["щ", "SH"], ["ъ", ""], ["ы", "I"], ["ь", ""], ["э", "E"], ["ю", "YU"], ["я", "YA"]
  ];
  const VOWELS = new Set(["A", "E", "I", "O", "U", "YA", "YE", "YO", "YU"]);
  const SHIFT = { B: "P", P: "B", D: "T", T: "D", G: "K", K: "G", J: "CH", CH: "J", DZ: "TS", TS: "DZ" };

  function tokenize(word, table) {
    const s = word.toLowerCase();
    const out = [];
    let i = 0;
    while (i < s.length) {
      let hit = null;
      for (const [k, v] of table) { if (s.startsWith(k, i)) { hit = [k, v]; break; } }
      if (!hit) { i += 1; continue; }
      i += hit[0].length;
      if (hit[1] === "") continue;
      // les consonnes doublées (nn, ss) sont gardées : « Hovhannisyan » s'écrit avec deux n ; une variante simplifiée est proposée plus loin
      if (hit[1] === "YA") { out.push("Y", "A"); continue; }
      out.push(hit[1]);
    }
    return out;
  }

  // ---------------------------------------------------------------- terminaisons
  const SUFFIXES = [ // du plus long au plus court, en phonèmes
    { seq: ["Y", "A", "N", "TS"], type: "YANTS" }, { seq: ["I", "A", "N", "TS"], type: "YANTS" },
    { seq: ["Y", "A", "N", "Z"], type: "YANTS" }, { seq: ["I", "A", "N", "Z"], type: "YANTS" },
    { seq: ["J", "A", "N", "Z"], type: "YANTS" }, { seq: ["I", "A", "N", "S"], type: "YANTS" },
    { seq: ["Y", "A", "N", "S"], type: "YANTS" }, { seq: ["E", "N", "TS"], type: "ENTS" }, { seq: ["E", "N", "Z"], type: "ENTS" },
    { seq: ["Y", "A", "N"], type: "YAN" }, { seq: ["I", "A", "N"], type: "YAN" }, { seq: ["J", "A", "N"], type: "YAN" },
    { seq: ["E", "A", "N"], type: "YAN" }
  ];
  function splitSuffix(ph) {
    for (const s of SUFFIXES) {
      const n = s.seq.length;
      if (ph.length > n && s.seq.every((p, k) => ph[ph.length - n + k] === p)) return { stem: ph.slice(0, -n), type: s.type };
    }
    return { stem: ph, type: "NONE" };
  }
  const SUFFIX_RENDER = {
    en: { YAN: ["yan", "ian"], YANTS: ["yants", "iants", "ianz", "yantz"], ENTS: ["ents", "entz"], NONE: [""] },
    fr: { YAN: ["ian"], YANTS: ["iantz", "iants"], ENTS: ["entz"], NONE: [""] },
    de: { YAN: ["jan"], YANTS: ["janz"], ENTS: ["enz"], NONE: [""] },
    ru: { YAN: ["ян"], YANTS: ["янц"], ENTS: ["енц"], NONE: [""] }
  };

  // ---------------------------------------------------------------- variantes de lecture (sur les phonèmes)
  function readingVariants(stem) {
    const out = [{ ph: stem, why: [] }];
    const add = (ph, why) => out.push({ ph, why });
    // h initial muet (Hovhannisyan / Ovanesyan / Ohanian), h après consonne (Hovhannisyan / Hovannisyan)
    if (stem[0] === "H") add(stem.slice(1), ["initial h dropped (Western and Russian usage)"]);
    const hIdx = stem.findIndex((p, k) => k > 0 && p === "H" && !VOWELS.has(stem[k - 1]));
    if (hIdx > 0) {
      add(stem.filter((_, k) => k !== hIdx), ["inner h dropped"]);
      if (stem[0] === "H") add(stem.filter((_, k) => k !== 0 && k !== hIdx), ["initial and inner h dropped"]);
    }
    // consonne doublée simplifiée (Hovhannisyan / Hovhanisyan)
    const dbl = stem.findIndex((p, k) => k > 0 && p === stem[k - 1] && !VOWELS.has(p));
    if (dbl > 0) add(stem.filter((_, k) => k !== dbl), ["double consonant simplified"]);
    // lecture « française » de l'entrée : ch = sh, j = zh
    if (stem.includes("CH")) add(stem.map(p => (p === "CH" ? "SH" : p)), ["“ch” read the French way (sh sound)"]);
    if (stem.includes("J")) add(stem.map(p => (p === "J" ? "ZH" : p)), ["“j” read the French way (zh sound)"]);
    // voyelle i / e interchangeable (Hovhannisyan / Hovhannesyan), une seule à la fois
    stem.forEach((p, k) => {
      if (k > 0 && k < stem.length - 1 && (p === "I" || p === "E")) {
        add(stem.map((q, j) => (j === k ? (p === "I" ? "E" : "I") : q)), ["vowel “" + p.toLowerCase() + "” written differently"]);
      }
    });
    // lecture occidentale : consonnes inversées (Petros / Bedros, Gevorg / Kevork) ; toutes les combinaisons, jusqu'à 4 consonnes
    const shiftable = stem.map((p, k) => (SHIFT[p] ? k : -1)).filter(k => k >= 0).slice(0, 4);
    for (let mask = 1; mask < (1 << shiftable.length); mask++) {
      const ph = stem.slice();
      const changed = [];
      shiftable.forEach((k, b) => { if (mask & (1 << b)) { changed.push(ph[k].toLowerCase() + "→" + SHIFT[ph[k]].toLowerCase()); ph[k] = SHIFT[ph[k]]; } });
      add(ph, ["Western Armenian (" + changed.join(", ") + ")"]);
      if (stem[0] === "H" && ph[0] === "H") add(ph.slice(1), ["Western Armenian (" + changed.join(", ") + ")", "initial h dropped"]);
    }
    return out;
  }

  // ---------------------------------------------------------------- rendu par usage
  const RENDER = {
    en: { A: "a", B: "b", CH: "ch", D: "d", DZ: "dz", E: "e", F: "f", G: "g", GH: "gh", H: "h", I: "i", J: "j", K: "k", KH: "kh",
      L: "l", M: "m", N: "n", O: "o", P: "p", R: "r", S: "s", SH: "sh", T: "t", TS: "ts", U: "u", V: "v", Y: "y", YE: "ye", YO: "yo",
      YU: "yu", Z: "z", ZH: "zh" },
    fr: { CH: "tch", SH: "ch", J: "dj", ZH: "j", U: "ou", YU: "iou", Y: "y", YO: "io" },
    de: { CH: "tsch", SH: "sch", J: "dsch", ZH: "sh", V: "w", Y: "j", YU: "ju", YO: "jo", KH: "ch", TS: "z", Z: "s" },
    ru: { A: "а", B: "б", CH: "ч", D: "д", DZ: "дз", E: "е", F: "ф", G: "г", GH: "г", H: "", I: "и", J: "дж", K: "к", KH: "х",
      L: "л", M: "м", N: "н", O: "о", P: "п", R: "р", S: "с", SH: "ш", T: "т", TS: "ц", U: "у", V: "в", Y: "й", YE: "е", YO: "ё",
      YU: "ю", Z: "з", ZH: "ж" }
  };
  function renderStem(ph, style) {
    const map = style === "ru" ? RENDER.ru : Object.assign({}, RENDER.en, RENDER[style] || {});
    let s = "";
    ph.forEach((p, k) => {
      const prev = ph[k - 1], next = ph[k + 1];
      if (style === "ru") {
        if (p === "Y" && next === "A") { s += "я"; return; }
        if (p === "A" && prev === "Y") return;
        if (p === "E" && k === 0) { s += "э"; return; }
        s += map[p] === undefined ? "" : map[p];
        return;
      }
      if (style === "fr" && p === "S" && VOWELS.has(prev) && VOWELS.has(next)) { s += "ss"; return; } // « s » entre voyelles s'écrit « ss » en français
      if (style === "fr" && p === "G" && (next === "E" || next === "I")) { s += "gu"; return; }
      s += map[p] === undefined ? "" : map[p];
    });
    return s;
  }
  function capitalize(s) { return s.split("-").map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join("-"); }

  // ---------------------------------------------------------------- programme principal
  function scriptOf(name) {
    if (/[Ա-֏]/.test(name)) return "hy";
    if (/[Ѐ-ӿ]/.test(name)) return "ru";
    return "latin";
  }
  const STYLE_LABEL = { en: "English", fr: "French", de: "German", ru: "Russian" };

  function variantsFromPhonemeParts(parts) {
    // parts : un tableau de mots (noms composés « Ter-Petrosyan ») en phonèmes ; seul le dernier porte la terminaison
    const last = splitSuffix(parts[parts.length - 1]);
    const heads = parts.slice(0, -1);
    const results = new Map();
    const readings = readingVariants(last.stem);
    const westernHead = h => h.map(p => SHIFT[p] || p); // « Ter » devient « Der » en occidental
    for (const r of readings) {
      const isWestern = r.why.some(x => x.startsWith("Western Armenian"));
      // un nom composé garde sa première partie telle quelle, ou la passe aussi en occidental
      const headOptions = isWestern && heads.length ? [heads, heads.map(westernHead)] : [heads];
      for (const hs of headOptions) {
        for (const style of ["en", "fr", "de", "ru"]) {
          const sufs = SUFFIX_RENDER[style][last.type];
          sufs.forEach((suf, si) => {
            const headTexts = hs.map(h => renderStem(h, style));
            const form = capitalize(headTexts.concat([renderStem(r.ph, style) + suf]).join("-"));
            const why = r.why.concat(style !== "en" ? [STYLE_LABEL[style] + " usage"] : []).concat(si > 0 ? ["ending “-" + suf + "”"] : []);
            const score = r.why.length + (style === "en" ? 0 : 0.5) + si * 0.25 + (hs !== heads ? 0.25 : 0);
            const key = form.toLowerCase();
            if (!results.has(key) || results.get(key).score > score) results.set(key, { form, why, score, script: style === "ru" ? "cyrillique" : "latin" });
          });
        }
      }
    }
    return [...results.values()].sort((a, b) => a.score - b.score || a.form.localeCompare(b.form));
  }

  // arménien occidental à partir de l'écriture arménienne (connaissance exacte des consonnes)
  const HY_WEST = { "ա": "a", "բ": "p", "գ": "k", "դ": "t", "ե": "e", "զ": "z", "է": "e", "ը": "e", "թ": "t", "ժ": "zh", "ի": "i",
    "լ": "l", "խ": "kh", "ծ": "dz", "կ": "g", "հ": "h", "ձ": "ts", "ղ": "gh", "ճ": "j", "մ": "m", "յ": "y", "ն": "n", "շ": "sh",
    "ո": "o", "չ": "ch", "պ": "b", "ջ": "ch", "ռ": "r", "ս": "s", "վ": "v", "տ": "d", "ր": "r", "ց": "ts", "ւ": "v", "փ": "p",
    "ք": "k", "օ": "o", "ֆ": "f", "և": "ev" };
  function westernFromArmenian(word) {
    const s = word.toLowerCase();
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i], n = s[i + 1];
      if (c === "ո" && n === "ւ") { out += "u"; i++; continue; }
      if (c === "յ" && i === 0) { out += "h"; continue; } // Յակոբ → Hagop
      out += HY_WEST[c] !== undefined ? HY_WEST[c] : c;
    }
    return out;
  }

  function variants(name, lib) {
    const clean = String(name || "").trim();
    if (!clean) return [];
    const script = scriptOf(clean);
    if (script === "hy") {
      const seeds = [];
      if (lib && lib.transliterate) {
        [["bgn-pcgn", "BGN/PCGN standard"], ["ala-lc", "Library of Congress standard"], ["ru-proper-vartapetyan-1961", "Russian proper-name standard (Vartapetyan)"]]
          .forEach(([std, label]) => { try { seeds.push({ form: lib.transliterate(clean, { standard: std }), why: [label], score: 0 }); } catch (e) {} });
      }
      const west = capitalize(clean.split("-").map(westernFromArmenian).join("-"));
      seeds.push({ form: west, why: ["Western Armenian pronunciation"], score: 0.5 });
      const more = seeds.filter(s => /[a-z]/i.test(s.form)).flatMap(s => variants(s.form).slice(0, 12).map(v => ({ form: v.form, why: s.why.concat(v.why), score: s.score + v.score + 0.5 })));
      const all = new Map();
      seeds.concat(more).forEach(v => { const k = v.form.toLowerCase(); if (!all.has(k) || all.get(k).score > v.score) all.set(k, Object.assign({ script: /[а-я]/i.test(v.form) ? "cyrillique" : "latin" }, v)); });
      return [...all.values()].sort((a, b) => a.score - b.score).slice(0, 80);
    }
    const table = script === "ru" ? CYR_TOKENS : LATIN_TOKENS;
    const parts = clean.split(/[-\s]+/).filter(Boolean).map(w => tokenize(w, table));
    return variantsFromPhonemeParts(parts).slice(0, 80);
  }

  const api = { variants, tokenize, splitSuffix, westernFromArmenian };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.RelocateNames = api;
})(typeof window !== "undefined" ? window : globalThis);
