import { installPoolCapture } from "./admin-users/database.js";
import { installExpressIntegration } from "./admin-users/express-integration.js";

/**
 * Point d'entrée minimal préchargé par Node avant server.js.
 * Le détail des responsabilités se trouve dans backend/admin-users/.
 */
installPoolCapture();
installExpressIntegration();
