import { APP_VERSION_LABEL } from "../config/constants";

const QUESTIONS = [
  [
    "À quoi sert ClimbCrew ?",
    "ClimbCrew gère les séances, les inscriptions, les participants, les voies et la progression des grimpeurs.",
  ],
  [
    "Comment enregistrer une voie réalisée ?",
    "Ouvrez l’onglet Voies, choisissez Réalisation, puis sélectionnez un jour, un participant inscrit et une voie.",
  ],
  [
    "Que signifient les couleurs ?",
    "Le fond d’un participant correspond à son passeport. La bordure indique si sa cotisation est à jour.",
  ],
  [
    "Qui gère les comptes ?",
    "Seuls les administrateurs peuvent approuver, révoquer, réactiver ou réinitialiser un compte.",
  ],
  [
    "Que signifie CPR ?",
    "Le Climbing Progress Rating synthétise les réalisations des 90 derniers jours et classe les dix meilleures performances.",
  ],
];

export function FaqView() {
  return (
    <section className="card">
      <div className="card-header">
        <h2>FAQ</h2>
        <span className="badge">{APP_VERSION_LABEL}</span>
      </div>
      {QUESTIONS.map(([question, answer]) => (
        <article className="faq-item" key={question}>
          <strong>{question}</strong>
          <p>{answer}</p>
        </article>
      ))}
    </section>
  );
}
