import os

texte_recherche = "Holzbriketts Nestro Hartholz"

for root, dirs, files in os.walk("."):
    for file in files:
        chemin = os.path.join(root, file)

        try:
            with open(chemin, "r", encoding="utf-8", errors="ignore") as f:
                contenu = f.read()

            if texte_recherche in contenu:
                print(f"Texte trouvé dans : {chemin}")

        except Exception:
            # Ignore les fichiers qui ne peuvent pas être lus
            pass