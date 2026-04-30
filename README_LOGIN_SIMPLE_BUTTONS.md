# Correctif login — styles appliqués + boutons simplifiés

Ce patch part du `App.jsx` fourni et corrige la page de connexion :

- les styles du login sont injectés directement dans le rendu ;
- la carte de connexion est plus compacte ;
- les boutons d’onglets sont simplifiés ;
- les formulaires du login passent en une colonne ;
- le bouton principal est aligné à gauche ;
- le logo du login utilise une classe dédiée plus petite.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_LOGIN_SIMPLE_BUTTONS.md
git commit -m "Fix login styles et simplification boutons"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
