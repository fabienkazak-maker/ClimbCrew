import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

function replaceOnce(source, oldText, newText, marker) {
  if (marker && source.includes(marker)) return source;
  if (!source.includes(oldText)) throw new Error(`Correctif backend impossible : motif introuvable (${oldText.slice(0, 80)})`);
  return source.replace(oldText, newText);
}

let source = fs.readFileSync(new URL("./server.js", import.meta.url), "utf8");

source = replaceOnce(source,
`function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}
`,
`function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function defaultSessionStatus(date, slot) {
  const day = new Date(\`${date}T12:00:00\`).getDay();
  return slot === "midi" && (day === 2 || day === 4) ? "encadree" : "libre";
}
`,
"function defaultSessionStatus(date, slot)");

source = replaceOnce(source,
`      status = "fermee",
      encadrantId = null,
`,
`      status = null,
      encadrantId = null,
`,
`status = null,
      encadrantId = null,`);

source = replaceOnce(source,
`    if (!id || !date || !slot) {
      return res.status(400).json({ error: "id, date and slot are required" });
    }

    await client.query("begin");
`,
`    if (!id || !date || !slot) {
      return res.status(400).json({ error: "id, date and slot are required" });
    }

    const resolvedStatus = status || defaultSessionStatus(date, slot);

    await client.query("begin");
`,
"const resolvedStatus = status || defaultSessionStatus(date, slot);");

source = replaceOnce(source,
`      [id, date, slot, status, encadrantId || null, referentId || null]
    );

    await client.query("delete from session_participants where session_id = $1", [id]);

    const uniqueParticipantIds = [...new Set(participantIds.map(String))];

    if (status === "libre" && uniqueParticipantIds.length) {
      const eligibleResult = await client.query(
        \`select id from participants where id = any($1::bigint[]) and lower(passport) in ('jaune', 'orange', 'vert', 'bleu')\`,
        [uniqueParticipantIds]
      );
      const eligibleIds = new Set(eligibleResult.rows.map((row) => String(row.id)));
      const ineligibleIds = uniqueParticipantIds.filter((participantId) => !eligibleIds.has(participantId));
      if (ineligibleIds.length) {
        await client.query("rollback");
        return res.status(400).json({
          error: "Une séance libre est réservée aux passeports Jaune, Orange, Vert ou Bleu.",
        });
      }
    }
`,
`      [id, date, slot, resolvedStatus, encadrantId || null, referentId || null]
    );

    const previousParticipantsResult = await client.query(
      \`select participant_id from session_participants where session_id = $1\`,
      [id]
    );
    const previousParticipantIds = new Set(
      previousParticipantsResult.rows.map((row) => String(row.participant_id))
    );

    await client.query("delete from session_participants where session_id = $1", [id]);

    const uniqueParticipantIds = [...new Set(participantIds.map(String))];
    const newlyAddedParticipantIds = uniqueParticipantIds.filter(
      (participantId) => !previousParticipantIds.has(participantId)
    );

    if (resolvedStatus === "libre" && newlyAddedParticipantIds.length) {
      const eligibleResult = await client.query(
        \`select id from participants where id = any($1::bigint[]) and lower(passport) in ('jaune', 'orange', 'vert', 'bleu')\`,
        [newlyAddedParticipantIds]
      );
      const eligibleIds = new Set(eligibleResult.rows.map((row) => String(row.id)));
      const ineligibleIds = newlyAddedParticipantIds.filter((participantId) => !eligibleIds.has(participantId));
      if (ineligibleIds.length) {
        await client.query("rollback");
        return res.status(400).json({
          error: "Une séance libre est réservée aux passeports Jaune, Orange, Vert ou Bleu pour toute nouvelle inscription.",
        });
      }
    }
`,
"const previousParticipantsResult = await client.query(");

const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), "climbcrew-runtime-"));
try {
  fs.symlinkSync(path.join(process.cwd(), "node_modules"), path.join(runtimeDir, "node_modules"), "dir");
} catch {}
const runtimeFile = path.join(runtimeDir, "server.mjs");
fs.writeFileSync(runtimeFile, source, "utf8");
await import(pathToFileURL(runtimeFile).href);
