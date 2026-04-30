# Patch fusionné — login premium compact

Ce patch conserve le fichier App.jsx actuel et réapplique la mise en page premium du login.

## Modifications

- logo réduit d’environ 75 % ;
- logo et titre sur une même ligne ;
- carte de connexion premium plus propre ;
- bloc "Compte par défaut" mis en valeur ;
- onglets de connexion plus lisibles ;
- formulaires mieux espacés ;
- responsive conservé.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_PATCH_FUSION_LOGIN_PREMIUM.md
git commit -m "Patch fusionne login premium"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
