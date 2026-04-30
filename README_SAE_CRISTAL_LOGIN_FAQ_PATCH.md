# Patch ClimbCrew — logo login d'origine + FAQ SAE Cristal

## Modifications

- logo de la page de login remis à sa taille d'origine ;
- styles du login injectés directement dans le rendu pour garantir leur affichage ;
- texte d’avertissement remplacé par `Ceci est un compte de test` ;
- FAQ réécrite sans aspects techniques ;
- ajout de l’explication des boutons de la page de login ;
- précision que l’application est dédiée au site SAE de Cristal.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_SAE_CRISTAL_LOGIN_FAQ_PATCH.md
git commit -m "Login origine et FAQ SAE Cristal"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
