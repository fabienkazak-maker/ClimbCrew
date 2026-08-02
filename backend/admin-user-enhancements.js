import { configureDeploymentEnvironment } from "./deployment-compatibility.js";
import { installPoolCapture } from "./admin-users/database.js";
import { installExpressIntegration } from "./admin-users/express-integration.js";

/**
 * Point d'entrée préchargé par Node avant server.js.
 *
 * Rôle : installer les adaptations transverses avant que le serveur principal
 * ne lise ses variables d'environnement et ne déclare ses routes Express.
 *
 * Impact visuel : aucun composant graphique n'est modifié directement. Cette
 * préparation évite toutefois les écrans vides, les erreurs CORS et les retours
 * à la page de connexion lorsque frontend et backend sont séparés sur Render.
 */

// 1. Fusionne les origines autorisées et applique les valeurs Render uniquement
//    lorsqu'aucune valeur explicite n'a été fournie par le serveur Linux.
configureDeploymentEnvironment();

// 2. Capture le pool PostgreSQL créé par server.js afin que les modules séparés
//    de gestion des comptes utilisent exactement la même connexion à la base.
installPoolCapture();

// 3. Installe les routes complémentaires et la compatibilité CSRF avant que
//    server.js ne commence à enregistrer ses middlewares et ses contrôleurs.
installExpressIntegration();
