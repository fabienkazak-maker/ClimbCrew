# Patch ClimbCrew — passeport découverte

Modification intégrée :

- les participants avec passeport `decouverte`, `découverte`, `decouvertes` ou `découvertes`
  apparaissent avec :
  - fond noir
  - texte blanc
  - cadre rouge

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_DECOUVERTE_PATCH.md
git commit -m "Style passeport découverte"
git push
```

Puis sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
