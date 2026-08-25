import { configureDeploymentEnvironment } from "./deployment-compatibility.js";
import { installPoolCapture } from "./admin-users/database.js";
import { installCookieHardening } from "./admin-users/cookie-hardening.js";
import { installPreBodyRateLimit } from "./admin-users/prebody-rate-limit.js";
import { installClientIpHardening } from "./admin-users/client-ip-hardening.js";
import { installRateLimitLogIntegration } from "./admin-users/rate-limit-log-integration.js";
import { installExpressIntegration } from "./admin-users/express-integration.js";
import { installMigrationHook } from "./admin-users/migration-service.js";
import { installInitiatorQualificationIntegration } from "./admin-users/initiator-qualification-integration.js";

/**
 * Point d'entrée préchargé par Node avant server.js.
 * Installe les adaptations transverses avant les middlewares historiques.
 */

configureDeploymentEnvironment();
installPoolCapture();

// L'ordre est volontaire : cookie sûr -> limite précoce -> IP canonique -> logs.
installCookieHardening();
installPreBodyRateLimit();
installClientIpHardening();
installRateLimitLogIntegration();
installExpressIntegration();
installMigrationHook();
installInitiatorQualificationIntegration();
