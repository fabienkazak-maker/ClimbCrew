# 🧗‍♂️ ClimbCrew — Spécifications fonctionnelles

---

## 🎯 1. Objectif du système

ClimbCrew est une application web permettant de gérer un groupe d’escalade :

* organisation des séances
* gestion des participants
* suivi des voies
* enregistrement des performances
* analyse de la progression

---

## 👥 2. Acteurs

### 2.1 Utilisateur standard

* consulte les séances
* s’inscrit à une séance
* enregistre ses réalisations

### 2.2 Administrateur

* gère les participants
* gère les voies
* accède aux données complètes
* importe / exporte les données

---

## 📅 3. Module Inscriptions

### 3.1 Fonctionnalités

* affichage par **jour** ou **semaine**
* navigation :

  * jour précédent / suivant
  * semaine précédente / suivante
* deux séances par jour :

  * midi
  * soir

### 3.2 Gestion des séances

Chaque séance possède :

* date
* type (midi / soir)
* statut :

  * fermée
  * libre
  * encadrée
* encadrant (si encadrée)
* référent (si libre)
* liste des participants

### 3.3 Contraintes

* maximum **18 participants (encadrement inclus)**
* inscriptions possibles uniquement en semaine
* un participant ne peut être inscrit qu’une fois par séance

---

## 🧑‍🤝‍🧑 4. Module Participants

### 4.1 Données

* nom (anonymisé : initiale)
* prénom
* niveau passeport :

  * sans
  * jaune
  * orange
  * vert
  * découverte
* cotisation (oui/non)
* licence FFME (oui/non)
* rôles :

  * encadrant
  * référent

### 4.2 Fonctionnalités

* ajout / modification / suppression
* tri alphabétique
* affichage coloré selon le passeport
* suivi du nombre de participations

---

## 🧗 5. Module Voies

### 5.1 Structure

Une voie est définie par :

* corde (numéro + couleur)
* couleur de la voie
* cotation de référence
* cotation ajustée
* nom de la voie
* nom de l’ouvreur
* statut (active / archivée)
* option :

  * moulinette uniquement

### 5.2 Règles

* modification réservée aux administrateurs
* affichage regroupé par corde
* fond coloré selon la voie

### 5.3 Ajustement de cotation

* basé sur les retours utilisateurs
* calcul :

  * moyenne
  * médiane
  * médiane pondérée (selon style)

---

## 📝 6. Module Réalisations

### 6.1 Données enregistrées

* participant
* séance
* voie
* date
* style de réalisation :

  * à vue
  * flash
  * en tête
  * moulinette
  * avec repos
  * travaillée
* cotation proposée
* nombre d’essais
* commentaire

### 6.2 Contraintes

* une réalisation liée à une séance
* le participant doit être inscrit à la séance

---

## 📈 7. Module Progression

### 7.1 Objectif

Suivre la progression individuelle

### 7.2 Indicateurs

* nombre de voies réalisées
* meilleure cotation
* meilleure cotation "propre"
* CPR (Climbing Performance Rating)

### 7.3 CPR simplifié

* basé sur les dernières réalisations
* pondération selon le style
* calcul d’un indice moyen
* conversion en cotation

---

## 📊 8. Module Statistiques

### 8.1 Indicateurs globaux

* nombre d’inscrits uniques
* nombre de cotisations
* nombre de licences FFME
* nombre de voies actives
* nombre de réalisations

### 8.2 Liste des participants

* tri alphabétique
* affichage :

  * statut cotisation
  * licence
  * nombre de participations
  * niveau

---

## ⚙️ 9. Module Administration

### 9.1 Accès

* protégé par code à 8 chiffres

### 9.2 Fonctionnalités

* gestion complète des participants
* import JSON
* export JSON
* édition des données

---

## ❓ 10. Module FAQ

### 10.1 Contenu

* fonctionnement des inscriptions
* règles des séances
* gestion des voies
* logique de progression
* sauvegarde des données

---

## 🗄️ 11. Données & Persistance

### 11.1 Mode local

* stockage navigateur (localStorage)

### 11.2 Mode serveur

* backend Node.js
* base PostgreSQL
* API REST

### 11.3 Synchronisation

* participants synchronisés via API
* fallback local si API indisponible

---

## 🔐 12. Sécurité

* séparation frontend / backend
* variables d’environnement
* contrôle CORS
* anonymisation partielle des données

---

## 🚀 13. Architecture technique

```text
Frontend (React + Vite)
        ↓
Backend API (Express)
        ↓
PostgreSQL (Render)
```

---

## 🔮 14. Évolutions possibles

* authentification utilisateurs
* gestion multi-clubs
* réservation automatique
* notifications
* statistiques avancées
* application mobile
* gestion financière (cotisations)

---

## 📌 15. Contraintes générales

* responsive (mobile / desktop)
* simplicité d’usage
* performance (chargement rapide)
* cohérence des données
* modularité pour évolutions futures

---

# ✅ Conclusion

ClimbCrew est une application modulaire orientée **gestion opérationnelle + suivi de performance** pour un club d’escalade, avec une architecture évolutive vers un système complet multi-utilisateurs.
