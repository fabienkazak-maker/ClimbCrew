# Avatars évolutifs

Les avatars évolutifs utilisent 8 niveaux (`level-1.webp` à `level-8.webp`).

Pour les animaux, fruits, personnages non humains et objets, chaque avatar possède désormais deux séries indépendantes :

- `homme/level-1.webp` à `homme/level-8.webp`
- `femme/level-1.webp` à `femme/level-8.webp`

Les différences entre les deux variantes restent discrètes et non stéréotypées. Les anciennes images `level-N.webp` sont conservées comme sources historiques et solution de compatibilité.

Les avatars humains historiques restent séparés dans `humain_homme` et `humain_femme`, avec 8 niveaux non vides pour chacun.

Le composant `frontend/src/components/ProfileGecko.jsx` sélectionne la variante correspondant au sexe du profil. Si le sexe n'est pas précisé, son mécanisme de repli conserve un affichage stable.
