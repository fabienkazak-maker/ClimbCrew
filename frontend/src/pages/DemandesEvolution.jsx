import React, { useEffect, useState } from "react";
import { authApiFetch } from "../lib/api.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function DemandesEvolution({ USE_API, authToken }) {
  const [requests, setRequests] = useState([]);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
    if (!USE_API) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      setRequests(await authApiFetch("/evolution-requests", authToken));
    } catch (requestError) {
      setError(requestError.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, [USE_API, authToken]);

  async function submitRequest(event) {
    event.preventDefault();
    try {
      setError("");
      await authApiFetch("/evolution-requests", authToken, {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setDraft({ title: "", description: "" });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message || "Création impossible");
    }
  }

  async function vote(request) {
    const value = request.myVote === 1 ? 0 : 1;
    await authApiFetch(`/evolution-requests/${request.id}/vote`, authToken, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    await loadRequests();
  }

  async function voteDown(request) {
    const value = request.myVote === -1 ? 0 : -1;
    await authApiFetch(`/evolution-requests/${request.id}/vote`, authToken, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    await loadRequests();
  }

  async function addComment(event, requestId) {
    event.preventDefault();
    const body = String(commentDrafts[requestId] || "").trim();
    if (!body) return;
    await authApiFetch(`/evolution-requests/${requestId}/comments`, authToken, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    setCommentDrafts((current) => ({ ...current, [requestId]: "" }));
    await loadRequests();
  }

  if (!USE_API) return <div className="card"><p>Les demandes d’évolution nécessitent une connexion au serveur.</p></div>;

  return (
    <section className="evolution-page">
      <form className="card evolution-create" onSubmit={submitRequest}>
        <div className="card-header"><h2>Proposer une évolution</h2></div>
        <label>Titre</label>
        <input maxLength={140} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Résumez votre idée" />
        <label>Description</label>
        <textarea maxLength={4000} required rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Décrivez le besoin et le résultat attendu" />
        <button className="primary-button" type="submit">Ajouter la demande</button>
      </form>

      {error && <div className="error-box" role="alert">{error}</div>}
      {loading && <div className="muted-box">Chargement…</div>}
      {!loading && requests.length === 0 && <div className="muted-box">Aucune demande pour le moment.</div>}

      <div className="evolution-list">
        {requests.map((request) => (
          <article className="card evolution-card" key={request.id}>
            <div className="evolution-heading">
              <div><h2>{request.title}</h2><p className="small">{request.authorName} · {formatDate(request.createdAt)}</p></div>
              <div className="evolution-score" aria-label={`Score ${request.score}`}>{request.score > 0 ? "+" : ""}{request.score}</div>
            </div>
            <p className="evolution-description">{request.description}</p>
            <div className="evolution-votes">
              <button type="button" className={request.myVote === 1 ? "vote-button selected positive" : "vote-button positive"} onClick={() => vote(request)} aria-pressed={request.myVote === 1}>＋ Pour</button>
              <button type="button" className={request.myVote === -1 ? "vote-button selected negative" : "vote-button negative"} onClick={() => voteDown(request)} aria-pressed={request.myVote === -1}>− Contre</button>
              <span className="opinion-count">{request.opinionCount} {request.opinionCount > 1 ? "avis" : "avis"}</span>
            </div>

            <div className="evolution-comments">
              <h3>Commentaires ({request.comments.length})</h3>
              {request.comments.map((comment) => (
                <div className="evolution-comment" key={comment.id}>
                  <strong>{comment.authorName}</strong><span className="small"> · {formatDate(comment.createdAt)}</span>
                  <p>{comment.body}</p>
                </div>
              ))}
              <form className="comment-form" onSubmit={(event) => addComment(event, request.id)}>
                <textarea rows={2} maxLength={2000} required value={commentDrafts[request.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Ajouter un commentaire" aria-label={`Commenter ${request.title}`} />
                <button type="submit">Commenter</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
