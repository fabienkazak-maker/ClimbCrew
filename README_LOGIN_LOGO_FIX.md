# Correctif logo page de login

Ce patch modifie uniquement le logo de la page de login :

- création d'une classe dédiée `auth-login-logo`
- taille réduite pour le login
- pas d'impact sur les autres logos de l'application

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_LOGIN_LOGO_FIX.md
git commit -m "Correction logo page login"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
