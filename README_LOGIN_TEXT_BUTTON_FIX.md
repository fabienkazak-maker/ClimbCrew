# Correctif login — suppression textes + bouton à gauche

## Modifications

- suppression du texte `ClimbCrew` sur la page de login ;
- suppression du texte `Connexion requise pour accéder à l’application` ;
- remplacement de `À modifier ou supprimer après la première mise en service.` par `ceci est compte de test` ;
- alignement à gauche du bouton `Se connecter`.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_LOGIN_TEXT_BUTTON_FIX.md
git commit -m "Ajustement textes login et bouton"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
