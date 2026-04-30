# Correctif login premium — styles injectés dans le rendu

## Cause du problème

La page de login retournait avant le bloc `<style>{...}</style>` principal.
Résultat : le HTML premium s'affichait, mais sans ses styles, donc rendu "brut".

## Correction

- ajout d'une constante `AUTH_PREMIUM_STYLE`
- injection explicite de `<style>{AUTH_PREMIUM_STYLE}</style>` dans :
  - l'écran de chargement
  - la page de login

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_LOGIN_PREMIUM_STYLE_FIX.md
git commit -m "Fix styles login premium"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
