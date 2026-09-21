import { useState } from "react";

const EMPTY_PARTICIPANT = {
  nom: "", prenom: "", email: "", passport: "sans", passeportFfme: false, sexe: "",
  cotisation: false, ffme: false, canEncadrer: false, canReferer: false, canAdmin: false,
};

export function useParticipantEditorState() {
  const [newParticipant, setNewParticipant] = useState(EMPTY_PARTICIPANT);
  return { newParticipant, setNewParticipant };
}
