import { runAuthLifecycleSuite } from "./auth-lifecycle-suite";
import { runAuthSuite } from "./auth-suite";
import { runBusinessSuite } from "./business-suite";
import { runSessionSuite } from "./session-suite";
import { runTransferSuite } from "./transfer-suite";

const context = await runAuthSuite();
await runTransferSuite(context);
await runBusinessSuite(context);
await runSessionSuite(context);
await runAuthLifecycleSuite(context);
console.log("Suite API complète: succès");
