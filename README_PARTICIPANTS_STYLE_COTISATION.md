# Patch ClimbCrew — style participants cotisation / découverte

Modification demandée :

- participants avec passeport découverte :
  - fond gris ;
- participants cotisants :
  - cadre vert ;
- participants non cotisants :
  - cadre rouge.

Le style s'applique partout où l'application utilise `getPassportStyle` :
- inscrits aux séances ;
- listes de participants ;
- statistiques ;
- vue semaine.

## Installation

Dézipper à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_PARTICIPANTS_STYLE_COTISATION.md
git commit -m "Style participants cotisation et decouverte"
git push
```

Ensuite, sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```

## Retour arrière

```bash
git revert HEAD
git push
```
