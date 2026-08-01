# Architecture de la gestion des comptes

Cette évolution découpe la gestion des comptes administrateurs en modules courts, chacun responsable d’un seul sujet.

## Backend

Le point d’entrée `backend/admin-user-enhancements.js` ne fait que charger les modules.

- `admin-users/config.js` : constantes et variables d’environnement.
- `admin-users/database.js` : connexion PostgreSQL partagée et migrations idempotentes.
- `admin-users/security.js` : cookies, session, CSRF et contrôle administrateur.
- `admin-users/user-serializer.js` : format public des comptes sans donnée secrète.
- `admin-users/access-log-service.js` : journalisation des opérations sensibles.
- `admin-users/account-service.js` : création de compte, association au participant et droits administrateur.
- `admin-users/export-service.js` : export complet sans mots de passe ni jetons.
- `admin-users/express-integration.js` : branchement des services sur les routes existantes.

## Frontend

Le point d’entrée `frontend/src/admin-user-management.js` charge l’orchestrateur.

- `admin-user-management/config.js` : configuration de l’API.
- `admin-user-management/api-client.js` : requêtes HTTP et protection CSRF.
- `admin-user-management/dom-utils.js` : recherche ciblée des éléments de l’écran existant.
- `admin-user-management/download.js` : génération du fichier JSON.
- `admin-user-management/export-control.js` : bouton d’export global.
- `admin-user-management/admin-right-control.js` : case Administrateur.
- `admin-user-management/index.js` : orchestration et observation des changements React.

## Principes de maintenance

1. Une responsabilité principale par fichier.
2. Les routes et contrats API existants restent inchangés.
3. Les migrations sont rejouables sans destruction de données.
4. Les mots de passe, empreintes et jetons de session ne sont jamais exportés.
5. Les commentaires expliquent les décisions et les contraintes, pas chaque ligne évidente.
6. Toute nouvelle fonction liée aux comptes doit être ajoutée dans le service correspondant plutôt que dans les points d’entrée.
