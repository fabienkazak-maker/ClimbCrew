# ClimbCrew — modifications UI

Modifications incluses :

- logo intégré dans le header et le menu latéral (`public/logo-climbcrew.png`)
- navigation par bandeau latéral ouvrable/fermable
- onglet `Inscriptions` affiché par défaut au lancement
- date initialisée sur le jour courant au lancement
- boutons de navigation date réduits à `<` et `>`
- participants inscrits affichés sur un fond correspondant à la couleur de leur passeport
- bouton `Retirer` sur fond noir
- dans l’onglet Administration :
  - liste initiale triée par ordre alphabétique
  - les nouveaux participants ajoutés apparaissent en haut de liste pendant la session

## Déploiement

```bash
git add App.jsx public/logo-climbcrew.png README_UI_CHANGES.md
git commit -m "Amélioration UI inscriptions et navigation"
git push
```

Puis redéployer le Static Site Render.
