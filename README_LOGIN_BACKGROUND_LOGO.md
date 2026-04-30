# Patch — logo en fond d'écran de la page de login

Ce patch ajoute le logo ClimbCrew en fond discret de la page de connexion.

## Effet

- logo centré en arrière-plan ;
- opacité faible pour rester lisible ;
- taille adaptée desktop / mobile ;
- le formulaire reste au premier plan.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_LOGIN_BACKGROUND_LOGO.md
git commit -m "Logo en fond de page login"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
