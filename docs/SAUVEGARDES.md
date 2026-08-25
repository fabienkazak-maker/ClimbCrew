# Sauvegardes ClimbClubCristal

## Principe

La production Linux réalise une sauvegarde PostgreSQL complète au format `pg_dump --format=custom`.
Les fichiers sont stockés sur le serveur dans :

`/opt/climbcrew/backups`

Le répertoire est monté dans le conteneur backend sous `/backups`. Les dumps ne sont jamais servis comme fichiers statiques et sont exclus de Git.

## Planification

- Une sauvegarde est créée chaque jour à **03:00**, fuseau `Europe/Paris`.
- Si le backend redémarre après 03:00 et que la sauvegarde du jour manque, elle est créée au redémarrage.
- La sauvegarde du **lundi** est envoyée à `cristal.climbcrew@gmail.com`.
- En cas d'échec SMTP le lundi, le service retente l'envoi au plus une fois par heure.
- La rétention locale par défaut est de **35 jours**.

Variables :

- `BACKUP_TIMEZONE=Europe/Paris`
- `BACKUP_HOUR=3`
- `BACKUP_RECIPIENT=cristal.climbcrew@gmail.com`
- `BACKUP_RETENTION_DAYS=35`
- `BACKUP_UPLOAD_MAX_BYTES=52428800`

## Administration

La page Administration permet :

1. **Sauvegarder maintenant** : crée un dump local et tente immédiatement son envoi par e-mail.
2. **Actualiser la liste** : recharge les sauvegardes présentes sur le serveur.
3. **Envoyer** : renvoie une sauvegarde existante au destinataire configuré.
4. **Importer une sauvegarde `.dump`** : copie un dump externe sur le serveur après validation par `pg_restore --list`.
5. **Restaurer** : remplace la base active par le dump sélectionné.

Toutes ces routes sont protégées par authentification administrateur et CSRF.

## Sécurité de la restauration

Avant toute restauration :

1. le dump demandé est validé par `pg_restore --list` ;
2. une sauvegarde `pre-restore` de la base courante est créée automatiquement ;
3. le pool PostgreSQL de l'API est fermé ;
4. `pg_restore --clean --if-exists --exit-on-error` restaure le dump ;
5. toutes les sessions et tous les codes de réinitialisation restaurés sont révoqués ;
6. le conteneur backend redémarre grâce à `restart: unless-stopped`.

Si la restauration échoue après fermeture du pool, le service tente automatiquement de réappliquer la sauvegarde `pre-restore`.

L'interface impose deux confirmations, dont la saisie exacte de `RESTAURER`.

## Remarque sur les e-mails

Une sauvegarde PostgreSQL contient des données personnelles de l'application ainsi que les hachages de mots de passe. La boîte `cristal.climbcrew@gmail.com` doit donc être protégée par un mot de passe fort et l'authentification multifacteur.
