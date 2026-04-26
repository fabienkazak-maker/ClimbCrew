# Patch ClimbCrew — optimisation smartphone priorité 1

Ce patch applique les priorités 1 pour améliorer l'affichage smartphone :

- header plus compact ;
- logo réduit sur mobile ;
- barre de navigation mobile en bas de l'écran ;
- menu latéral conservé via le bouton à gauche ;
- cartes de séance plus compactes ;
- participants inscrits affichés en badges/chips tactiles ;
- bouton croix plus facile à toucher ;
- champs et boutons avec hauteur minimale tactile ;
- statistiques en cartes lisibles sur petit écran ;
- drawer latéral plein écran sur smartphone.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_MOBILE_PRIORITY_1.md
git commit -m "Optimisation smartphone priorite 1"
git push
```

Ensuite, sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```

## Retour arrière

Si le rendu ne convient pas :

```bash
git revert HEAD
git push
```
