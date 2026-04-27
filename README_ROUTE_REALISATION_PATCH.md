# Patch ClimbCrew — réalisation depuis l'onglet Voies

## Modifications

- Dans l'onglet **Voies**, chaque voie active dispose maintenant d'un bouton **Réalisation**.
- Ce bouton ouvre un popup permettant d'enregistrer une voie réalisée avec :
  - participant ;
  - séance ;
  - voie pré-sélectionnée ;
  - style de réalisation ;
  - cotation proposée ;
  - nombre d'essais ;
  - commentaire.
- Dans l'onglet **Progression**, la partie **Enregistrer une voie réalisée** est supprimée.
- Dans l'onglet **Progression**, **Historique des réalisations** est maintenant placé sous **Suivi individuel**.
- L'historique affiché est filtré sur le grimpeur sélectionné.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_ROUTE_REALISATION_PATCH.md
git commit -m "Enregistrement des réalisations depuis les voies"
git push
```

Ensuite, sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```

## Note

Les réalisations sont encore sauvegardées côté frontend/localStorage tant que les tables backend `realisations` ne sont pas ajoutées.
