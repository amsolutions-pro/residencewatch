// Essais du prototype de variantes de noms arméniens (Node). Usage : node test_names.cjs <names.js> <index.global.js>
const fs = require("fs");
const vm = require("vm");
const names = require(process.argv[2]);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[3], "utf8") + "\n;globalThis.__lib = armenianTransliteration;", ctx);
const lib = ctx.__lib;

const cases = [
  ["Petrosyan", ["Bedrosian", "Петросян"]],
  ["Gevorgyan", ["Kevorkian", "Геворгян"]],
  ["Hakobyan", ["Hagopian", "Акопян"]],
  ["Grigoryan", ["Krikorian", "Григорян"]],
  ["Khachatryan", ["Хачатрян", "Khatchatrian"]],
  ["Harutyunyan", ["Арутюнян", "Haroutiounian"]],
  ["Tigranyan", ["Dikranian", "Тигранян"]],
  ["Ter-Petrosyan", ["Ter-Bedrosian", "Тер-Петросян"]],
  ["Avetisyan", ["Аветисян", "Avetisian"]],
  ["Hovhannisyan", ["Hovannisian", "Ovhannisyan"]],
  ["Петросян", ["Petrosyan", "Bedrosian"]],
  ["Պետրոսյան", ["Petrosyan", "Bedrosyan", "Петросян"]],
  ["Հակոբյան", ["Hakobyan", "Hagopyan", "Hagopian"]]
];
let ok = 0;
for (const [input, expected] of cases) {
  const forms = names.variants(input, lib).map(v => v.form);
  const missing = expected.filter(e => !forms.some(f => f.toLowerCase() === e.toLowerCase()));
  const pass = missing.length === 0;
  if (pass) ok++;
  console.log((pass ? "OK   " : "MANQUE") + " " + input + " (" + forms.length + " variantes)" + (pass ? "" : " -> manque : " + missing.join(", ")));
  console.log("      premières : " + forms.slice(0, 8).join(" · "));
}
console.log(ok + "/" + cases.length + " cas réussis");
process.exit(ok === cases.length ? 0 : 1);
