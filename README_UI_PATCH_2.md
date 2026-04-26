# Patch UI ClimbCrew — ajustements demandés

## Modifications intégrées

- Suppression du texte :
  "Gestion des séances, des voies, des grimpeurs et de la progression."
- Date affichée au format texte :
  "Vendredi 04 avril"
- Boutons de navigation de date réduits à :
  "<" et ">"
- Bouton menu placé à gauche du bandeau supérieur
- Menu latéral conservé, ouvrable et refermable
- Champs "Statut", "RÉFÉRENT" / "Encadrant" et "Ajouter un inscrit" alignés sur une même ligne
- Bouton "Retirer" remplacé par une croix "×"
- Couleurs des voies rendues moins pastelles
- Fusion des onglets "Réalisations" et "Progression"
- Dans "Progression" :
  - champ par défaut "Choisir un grimpeur"
  - grimpeurs triés par ordre alphabétique
- Dans "Statistiques" :
  - ajout d'un tri par nom, passeport, cotisation, FFME ou participations
  - tri ascendant / descendant
- Le logo existant reste intégré.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew.

Puis :

```bash
git add App.jsx README_UI_PATCH_2.md
git commit -m "Améliorations UI inscriptions progression statistiques"
git push
```

Ensuite, sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
