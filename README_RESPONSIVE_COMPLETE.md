# Patch responsive complet — interface auto-adaptative

Ce patch rend l’interface plus auto-adaptative selon la taille de l’écran :

- largeurs fluides ;
- grilles en `auto-fit` / `minmax` ;
- formulaires plus souples ;
- cartes et modales plus compactes sur petit écran ;
- topbar, groupes de boutons et sélecteurs qui se replient automatiquement ;
- page de login plus compacte et mieux centrée ;
- amélioration générale mobile, tablette et desktop.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_RESPONSIVE_COMPLETE.md
git commit -m "Responsive complet interface"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```

## Vérification

Tester au minimum :
- grand écran desktop ;
- tablette ;
- smartphone en portrait ;
- smartphone en paysage.
