# Vérification et corrections ClimbCrew

Corrections appliquées dans ce ZIP :

- ajout de `backend/import-data.json`
- ajout de la route backend `/import-data?confirm=oui`
- lecture JSON robuste via `fs`
- conservation des routes `/setup-db`, `/db-status`, `/participants`, `/sessions`
- correction du script build Vite pour Render :
  `node ./node_modules/vite/bin/vite.js build`
- `.gitignore` présent : `node_modules`, `dist`, `.env`, `*.zip`

## Déploiement

```bash
git add .
git commit -m "Correction import backend et build Render"
git push
```

Puis sur Render backend :

```text
Manual Deploy → Deploy latest commit
```

Ensuite :

```text
https://climbcrew-api-khf7.onrender.com/setup-db
https://climbcrew-api-khf7.onrender.com/import-data?confirm=oui
https://climbcrew-api-khf7.onrender.com/participants
```

Résultat attendu pour l'import :

```json
{
  "ok": true,
  "message": "Import terminé",
  "participantsImported": 138,
  "sessionsImported": 362
}
```
