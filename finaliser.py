"""À lancer UNE FOIS, juste avant la publication : python finaliser.py <adresse-du-site> <e-mail-de-contact>
Exemple : python finaliser.py https://exemple.github.io/ contact@exemple.org
Remplit le contact des pages légales, ajoute les adresses canoniques, sitemap.xml et robots.txt."""
import datetime, os, re, sys
ici = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) != 3 or not sys.argv[1].startswith("https://") or "@" not in sys.argv[2]:
    sys.exit(__doc__)
base = sys.argv[1].rstrip("/") + "/"; contact = sys.argv[2]
pages = ["index.html", "ru.html", "hy.html", "checklist.html", "names.html", "legal.html", "privacy.html", "changes.html", "quotas.html", "fees.html", "entrepreneurs.html", "permanent-residence.html", "ru-quotas.html", "ru-fees.html", "ru-entrepreneurs.html", "ru-permanent-residence.html", "hy-quotas.html", "hy-fees.html", "hy-entrepreneurs.html", "hy-permanent-residence.html"]
aujourdhui = datetime.date.today().isoformat()
for p in pages:
    chemin = os.path.join(ici, p); s = open(chemin, encoding="utf-8").read()
    s = s.replace("{{CONTACT_EMAIL}}", contact)
    if 'rel="canonical"' not in s:
        s = s.replace("</title>", '</title>\n<link rel="canonical" href="%s">' % (base + ("" if p == "index.html" else p)), 1)
    open(chemin, "w", encoding="utf-8", newline="\n").write(s)
urls = "".join("  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (base + ("" if p == "index.html" else p), aujourdhui) for p in pages)
open(os.path.join(ici, "sitemap.xml"), "w", encoding="utf-8", newline="\n").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n")
open(os.path.join(ici, "robots.txt"), "w", encoding="utf-8", newline="\n").write("User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n" % base)
print("finalisé pour", base)
