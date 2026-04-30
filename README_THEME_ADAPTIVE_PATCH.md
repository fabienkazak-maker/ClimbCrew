# Patch ClimbCrew — thèmes adaptatifs par utilisateur

## Fonctionnalités ajoutées

- adaptation automatique au thème clair / sombre du poste utilisateur ;
- préférence utilisateur :
  - Automatique
  - Clair
  - Sombre
- sauvegarde locale de la préférence ;
- sauvegarde côté backend dans le compte utilisateur ;
- application automatique du thème au chargement de session ;
- sélecteur de thème dans la barre supérieure ;
- accès au réglage aussi dans l’onglet Administration.

## Fichiers modifiés

- App.jsx
- backend/server.js
- backend/schema.sql

## Déploiement

Dézipper à la racine du projet local ClimbCrew, puis :

```bash
git add App.jsx backend/server.js backend/schema.sql README_THEME_ADAPTIVE_PATCH.md
git commit -m "Ajout themes adaptatifs par utilisateur"
git push
```

Ensuite :
- redéployer le backend ;
- appeler `/setup-db` une fois pour ajouter la colonne `theme_preference` ;
- redéployer le frontend.

## Vérification

- se connecter avec un utilisateur ;
- changer le thème dans la barre supérieure ;
- recharger la page ;
- vérifier que la préférence est conservée.
