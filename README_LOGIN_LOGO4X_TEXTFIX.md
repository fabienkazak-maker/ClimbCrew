# Correctif login — logo x4 + suppression textes

## Modifications

- logo de la page de login agrandi x4 ;
- suppression du texte `ClimbCrew` ;
- suppression du texte `Connexion requise pour accéder à l’application.` ;
- remplacement de `À modifier ou supprimer après la première mise en service.` par `Ceci est un compte de test`.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_LOGIN_LOGO4X_TEXTFIX.md
git commit -m "Ajustement login logo x4 et textes"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
