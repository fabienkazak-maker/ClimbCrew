# Patch ClimbCrew — réalisations filtrées et modifiables

## Modifications

### Popup "Enregistrer une voie réalisée"

Dans le champ **Séance**, l'application ne propose plus toutes les dates.
Elle propose uniquement les séances où le participant sélectionné est inscrit.

Si le participant n'est inscrit à aucune séance :
- le champ affiche "Aucune séance inscrite" ;
- le bouton Enregistrer est désactivé.

### Historique des réalisations

Dans l'onglet Progression, sous **Historique des réalisations**, chaque réalisation devient modifiable :

- participant ;
- séance ;
- voie ;
- style ;
- cotation proposée ;
- nombre d'essais ;
- commentaire.

Les modifications sont sauvegardées dans l'état de l'application / localStorage.
Elles ne sont pas encore persistées en base tant que la table backend `realisations` n'est pas ajoutée.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_REALISATIONS_EDITABLES.md
git commit -m "Filtrage des seances et edition des realisations"
git push
```

Ensuite, sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
