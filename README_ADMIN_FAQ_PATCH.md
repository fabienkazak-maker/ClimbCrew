# Patch ClimbCrew — administration réservée aux admins + FAQ mise à jour

## Modifications

- l’onglet **Administration** n’est visible que pour les comptes administrateurs ;
- dans **Voies**, les éléments suivants sont réservés aux comptes administrateurs :
  - **Ajouter une voie**
  - bouton **Archiver / Réactiver**
  - bouton **Appliquer cotation ajustée**
- les comptes non administrateurs peuvent continuer à consulter les voies et enregistrer une réalisation ;
- la FAQ est enrichie avec :
  - les rôles de compte ;
  - le thème Auto / Clair / Sombre ;
  - les évolutions récentes ;
  - une explication du terme **CPR** ;
  - une explication du calcul du **CPR simplifié**.

## Installation

Dézipper ce patch à la racine du projet local ClimbCrew, en remplaçant `App.jsx`.

Puis :

```bash
git add App.jsx README_ADMIN_FAQ_PATCH.md
git commit -m "Restriction admin et FAQ CPR"
git push
```

Ensuite sur Render frontend :

```text
Manual Deploy → Clear build cache & deploy
```
