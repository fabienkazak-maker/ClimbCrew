# Patch ClimbCrew — priorité A mobile

Ce patch applique les améliorations prioritaires A :

- date + flèches sur une seule ligne ;
- date au format naturel : `Vendredi 04 avril` ;
- suppression de la capitalisation automatique du mois ;
- si l'application est ouverte samedi/dimanche, affichage du prochain lundi ;
- libellé court `Inscrit` au lieu de `Ajouter un inscrit` ;
- champs de séance plus compacts ;
- boutons `Jour` / `Semaine` dans un segment compact ;
- bouton `Semaine complète` raccourci en `Semaine`.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_MOBILE_PRIORITY_A.md
git commit -m "Optimisation mobile priorite A"
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
