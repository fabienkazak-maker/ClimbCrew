import React from "react";
import { API_BASE, apiFetch, apiUpload } from "../lib/api.js";\nimport "../styles/chat.css";

const EMOJIS = ["😀","😂","😊","😍","👍","👏","💪","🧗","🔥","🎉","❤️","🤔","😅","🙌","👋","✅","📸","🏆"];

export default function Chat({ myParticipantId, participants = [] }) {
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState("");
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef(null);
  const fileRef = React.useRef(null);
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
    if (!message || sending) return;
    try {
      setSending(true);
      setText("");
      await apiFetch("/chat/messages", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      await loadMessages();
    } catch (err) {
      setText(message);
      setError(String(err.message || err));
    } finally {
      setSending(false);
    }
  }

  async function shareFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || sending) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux. Maximum 10 Mo.");
      return;
    }
    try {
      setSending(true);
      const message = text.trim();
      setText("");
      await apiUpload("/chat/messages/attachment", file, {
        headers: { "X-Chat-Message": encodeURIComponent(message) },
      });
      await loadMessages();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSending(false);
    }
  }

  function displayName(participantId) {
    const participant = participantsById[String(participantId)];
    if (!participant) return "Grimpeur";
    return [participant.prenom, participant.nom].filter(Boolean).join(" ") || "Grimpeur";
  }

  function attachmentUrl(item) {
    return `${API_BASE}${item.attachmentUrl}`;
  }

  function renderAttachment(item) {
    if (!item.attachmentUrl) return null;
    const isImage = String(item.attachmentMimeType || "").startsWith("image/");
    if (isImage) {
      return (
        <a href={attachmentUrl(item)} target="_blank" rel="noreferrer" className="chat-image-link">
          <img className="chat-image" src={attachmentUrl(item)} alt={item.attachmentName || "Image partagée"} />
        </a>
      );
    }
    return (
      <a className="chat-file" href={attachmentUrl(item)} target="_blank" rel="noreferrer">
        <span aria-hidden="true">📎</span>
        <span>{item.attachmentName || "Fichier"}</span>
        {item.attachmentSize != null && <small>{Math.max(1, Math.round(item.attachmentSize / 1024))} Ko</small>}
      </a>
    );
  }

  return (
    <div className="card chat-page">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>Chat du club</h2>
          <div className="small">Messages, emoji, photos et fichiers entre les membres de ClimbCrew.</div>
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
                {renderAttachment(item)}
                {item.message && <div className="chat-message-text">{item.message}</div>}
                <div className="small">{new Date(item.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {showEmoji && (
        <div className="chat-emoji-picker" aria-label="Choisir un emoji">
          {EMOJIS.map((emoji) => (
            <button type="button" key={emoji} onClick={() => setText((value) => value + emoji)}>{emoji}</button>
          ))}
        </div>
      )}
      <form className="chat-composer" onSubmit={sendMessage}>
        <button type="button" className="chat-tool-button" onClick={() => setShowEmoji((value) => !value)} aria-label="Emoji">😊</button>
        <button type="button" className="chat-tool-button" onClick={() => fileRef.current?.click()} aria-label="Partager une image ou un fichier">📎</button>
        <input
          ref={fileRef}
          type="file"
          className="chat-file-input"
          onChange={shareFile}
          aria-label="Choisir une image ou un fichier"
        />
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          placeholder="Message"
          aria-label="Message"
        />
        <button type="submit" className="button" disabled={!text.trim() || sending}>{sending ? "…" : "Envoyer"}</button>
      </form>
    </div>
  );
}
