import { todayIso } from "../lib/domain.js";
import { buildRealisationDraft, resolveSessionIdForRealisation } from "../lib/realisation-workflow.js";

function storageKey(participantId, day) {
  return `climbcrew-qr-belayer:${participantId}:${day}`;
}

export function useQrRealisationFlow({
  myParticipantId,
  routesById,
  sessions,
  setNewRealisation,
  setRealisationModalRouteId,
  setSyncMessage,
}) {
  function openScannedRoute(routeId) {
    const participantId = myParticipantId || "";
    const route = routesById[routeId];
    const today = todayIso();

    if (!route) {
      setSyncMessage("Erreur : voie inconnue.");
      return;
    }
    if (!participantId) {
      setSyncMessage("Erreur : aucun grimpeur n’est associé à ce compte.");
      return;
    }

    const sessionId = resolveSessionIdForRealisation(sessions, participantId, today);
    if (!sessionId) {
      setSyncMessage("Erreur : vous devez être inscrit à une séance aujourd’hui avant d’enregistrer une réalisation par QR code.");
      return;
    }

    const rememberedBelayer = window.localStorage?.getItem(storageKey(participantId, today)) || "";
    setNewRealisation((previous) => ({
      ...buildRealisationDraft({
        previous,
        route,
        routeId,
        participantId,
        selectedDay: today,
        sessionId,
      }),
      assureurId: rememberedBelayer,
      scanQr: true,
    }));
    setRealisationModalRouteId(routeId);
  }

  function rememberQrBelayer(draft) {
    if (!draft?.scanQr || !draft.assureurId || draft.selectedDay !== todayIso() || !myParticipantId) return;
    window.localStorage?.setItem(
      storageKey(myParticipantId, draft.selectedDay),
      String(draft.assureurId),
    );
  }

  return { openScannedRoute, rememberQrBelayer };
}
