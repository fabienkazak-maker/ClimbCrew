import React from "react";
import { apiFetch } from "../lib/api.js";

export default function Chat({ myParticipantId, participants = [] }) {
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState("");
  const bottomRef = React.useRef(null);
  const participantsById = React.useMemo(
    () => Object.fromEntries(participants.map((participant) => [String(participant.id), participant])),
    [participants],
  );

  const loadMessages = React.useCallback(async () => {
    try {
      const data = await apiFetch("/chat/messages");
      setMessages(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(String(err.message || err));
    }
  }, []);

  React.useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    try {
      setText("");
      await apiFetch("/chat/messages", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      await loadMessages();
    } catch (err) {
      setText(message);
      setError(String(err.message || err));
    }
  }

  function displayName(participantId) {
    const participant = participantsById[String(participantId)];
    if (!participant) return "Grimpeur";
    return [participant.prenom, participant.nom].filter(Boolean).join(" ") || "Grimpeur";
  }

  return (
    <div className="card chat-page">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>Chat du club</h2>
          <div className="small">Messagerie instantanée entre les membres de ClimbCrew.</div>
        </div>
      </div>
      {error && <div className="muted-box" role="alert">{error}</div>}
      <div className="chat-thread" aria-live="polite">
        {messages.length === 0 && <div className="muted-box">Aucun message. Lancez la conversation.</div>}
        {messages.map((item) => {
          const mine = String(item.participantId) === String(myParticipantId);
          return (
            <div className={mine ? "chat-row chat-row-mine" : "chat-row"} key={item.id}>
              <div className={mine ? "chat-bubble chat-bubble-mine" : "chat-bubble"}>
                {!mine && <strong>{displayName(item.participantId)}</strong>}
                <div>{item.message}</div>
                <div className="small">{new Date(item.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form className="chat-composer" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          placeholder="Message"
          aria-label="Message"
        />
        <button type="submit" className="button" disabled={!text.trim()}>Envoyer</button>
      </form>
    </div>
  );
}
