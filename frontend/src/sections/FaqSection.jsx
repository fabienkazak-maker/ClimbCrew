import React from "react";

export default function FaqSection({ APP_VERSION, canAccessAdminTabs }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>FAQ - fonctionnement de ClimbClubCristal</h2>
        <span className="small">Version : {APP_VERSION}</span>
      </div>

      <details className="faq-item">
        <summary><strong>A quoi sert ClimbClubCristal ?</strong></summary>
        <div className="small">
          ClimbClubCristal permet de gérer les séances en vues Jour et Semaine, les inscriptions, les participants, les voies et la progression des grimpeurs du site SAE de Cristal. Une séance peut être Libre, Encadrée, Passeport, Challenge, Renouvellement ou Fermée. Le bandeau supérieur indique toujours la page active.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment enregistrer une voie réalisée ?</strong></summary>
        <div className="small">
          Dans l'onglet Voies, le bouton « Réalisation » ouvre la saisie. Si un jour est choisi, seuls les participants cotisants inscrits ce jour-là sont proposés. Si un participant est choisi, seuls ses jours d'inscription sont proposés. La saisie ne distingue pas les créneaux midi et soir.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment sont présentés les participants et les voies ?</strong></summary>
        <div className="small">
          Pour un participant, la bille placée à gauche du nom indique la couleur du passeport. Le cadre est vert si la cotisation est réglée et rouge sinon ; il est plein avec une licence FFME et en pointillés sans licence. En séance Libre, un fond hachuré signale une personne déjà inscrite sans passeport requis. Pour une voie, le fond reprend la couleur des prises et un cadre rouge indique une voie uniquement en moulinette.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment fonctionnent les avatars ?</strong></summary>
        <div className="small">
          Chaque grimpeur peut choisir un avatar parmi plusieurs animaux, personnages, fruits et objets. L’avatar évolue visuellement selon le niveau récent calculé par l’application. Ces représentations sont proposées à titre purement ludique : elles ne portent aucun jugement sur les personnes et n’ont aucune intention offensante, discriminatoire ou stéréotypée. Le choix d’un avatar ne modifie ni les droits, ni les statistiques, ni le classement du grimpeur.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment fonctionnent les badges ?</strong></summary>
        <div className="small">
          Les badges sont attribués automatiquement à partir des séances, voies et réalisations enregistrées. Ils illustrent notamment les premières réussites, les cotations atteintes, la régularité, l’exploration, les contributions et certains rôles du club. Les badges de vol et d’assurage comportent quatre niveaux, débloqués à 1, 5, 10 puis 50 vols enregistrés ou retenus. Ils sont uniquement ludiques, n’accordent aucun droit particulier et ne constituent pas une évaluation de la valeur ou des capacités d’une personne.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Que signifie CPR ?</strong></summary>
        <div className="small">
          Le CPR représente le niveau récent du grimpeur. Le calcul examine les réalisations des 90 derniers jours et convertit chaque cotation en indice, de 4a à 7b. Cet indice est multiplié par le coefficient du style : à vue 1,25 ; flash 1,20 ; en tête 1,00 ; moulinette 0,85 ; travaillée 0,75 ; avec repos 0,60 ; projet 0,30 ; non enchaînée 0,20 ; essai ou test 0,10. Les performances sont ensuite classées par indice pondéré et seules les 10 meilleures sont conservées. La moyenne de leurs indices pondérés est arrondie à l'indice de cotation le plus proche, puis reconvertie en cotation. S'il existe moins de 10 réalisations valides, le calcul utilise uniquement celles disponibles. Une voie facile d'échauffement ne réduit donc pas le CPR si elle ne figure pas parmi les 10 meilleures performances récentes.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment est calculée la cotation consensus ?</strong></summary>
        <div className="small">
          Le consensus utilise uniquement les cotations proposées pour la voie. Chaque cotation est convertie en indice de 4a = 0 à 7b = 14. L'indice CPR utilisé est limité à l'intervalle 0-14. Le poids d'un avis vaut 1 + (indice CPR du grimpeur ÷ 14) : il varie donc de 1 à 2. Sans CPR calculable, le poids reste égal à 1. La formule est : somme des indices proposés multipliés par leur poids, divisée par la somme des poids. Le résultat est arrondi à l'indice le plus proche puis reconverti en cotation. Ainsi, tous les avis comptent, tandis que l'expérience récente mesurée par le CPR augmente progressivement leur poids sans jamais le doubler au-delà de 2.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment sont calculées les statistiques des réalisations en tête ?</strong></summary>
        <div className="small">
          Le total correspond à tous les enregistrements dont le style est « En tête ». Pour chaque cotation, l'application compte les voies disponibles et les réalisations en tête enregistrées sur ces voies. Le ratio est égal au nombre de réalisations en tête divisé par le nombre de voies de la cotation. Il représente donc le nombre moyen de réalisations en tête par voie et peut dépasser 1. Sans voie pour une cotation, le ratio est indiqué « nc ».
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment fonctionne le Tableau d’honneur ?</strong></summary>
        <div className="small">
          Le Tableau d’honneur affiche les trois premiers grimpeurs pour le CPR, les points, les participations, les réalisations, les voies en tête, les records sur une séance et les vols enregistrés. Le nombre total compte chaque réalisation réussie, même si une voie est refaite lors d'une autre séance. Pour les records d'une séance, une même voie n'est comptée qu'une fois. La difficulté cumulée attribue 1 point à 4a, puis un point supplémentaire par niveau jusqu'à 15 points pour 7b, avant d'additionner les voies de la séance. Les personnes ayant la même valeur conservent le même rang.
        </div>
      </details>

      <details className="faq-item">
        <summary><strong>Comment fonctionne la règle des 1 000 points ?</strong></summary>
        <div className="small">
          Chaque voie distribue exactement 1 000 points entre les grimpeurs distincts qui l'ont enregistrée avec le style « En tête ». La part reçue pour une voie est donc égale à 1 000 divisé par le nombre de grimpeurs concernés. Par exemple, une personne seule reçoit 1 000 points ; quatre personnes reçoivent 250 points chacune. Plusieurs enregistrements en tête de la même voie par le même grimpeur ne lui donnent qu'une seule part. Les réalisations dans les autres styles ne distribuent pas de points. Le total d'un grimpeur est la somme de ses parts sur toutes les voies.
        </div>
      </details>

      {canAccessAdminTabs && (
        <>
          <details className="faq-item">
            <summary><strong>Qui peut accéder à Administration, Gestion des comptes et Log ?</strong></summary>
            <div className="small">
              Ces pages sont réservées aux administrateurs et ne sont pas affichées dans la navigation des utilisateurs standards.
            </div>
          </details>

          <details className="faq-item">
            <summary><strong>A quoi servent Gestion des comptes et Log ?</strong></summary>
            <div className="small">
              Gestion des comptes permet d'approuver, révoquer, réactiver et réinitialiser les accès. Log présente les événements utiles de connexion et d'authentification ; les changements d'ambiance n'y sont pas enregistrés.
            </div>
          </details>
        </>
      )}
    </div>
  );
}
