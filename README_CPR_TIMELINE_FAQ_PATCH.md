# Patch ClimbCrew — Timeline CPR détaillée + FAQ complète

## Modifications

### Timeline CPR simplifiée
- Affiche maintenant les réalisations les plus récentes en haut.
- Chaque ligne affiche :
  - date ;
  - nom de la voie ;
  - cotation ;
  - style.
- Ajout d'un bouton `Détails` sur chaque réalisation.

### Détails / modification
Le bouton `Détails` permet de modifier :
- séance ;
- voie ;
- style ;
- cotation proposée ;
- nombre d'essais ;
- commentaire.

Le nom du participant est affiché, mais non modifiable dans cette zone.

### FAQ
La FAQ est complétée avec :
- rôle de l'application ;
- données partagées / locales ;
- inscriptions ;
- couleurs des participants ;
- voies ;
- réalisations ;
- CPR ;
- sauvegarde ;
- dépannage.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_CPR_TIMELINE_FAQ_PATCH.md
git commit -m "Timeline CPR detaillee et FAQ complete"
git push
```

Ensuite, sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
