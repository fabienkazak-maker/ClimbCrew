import React from "react";
import Button from "../components/Button.jsx";
import { apiFetch } from "../lib/api.js";
import { ROUTE_COLORS } from "../lib/ui-config.js";

function localTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(value);
}

function challengeCriteriaLabel(criteria = {}) {
  const parts = [];
  if (criteria.color) parts.push(`Couleur : ${criteria.color}`);
  if (criteria.opener) parts.push(`Ouvreur : ${criteria.opener}`);
  return parts.join(" · ") || "Critères non précisés";
}

function routeLabel(route) {
  const rope = route.numeroCorde === null || route.numeroCorde === undefined ? "" : `Corde ${route.numeroCorde}`;
  return [rope, route.couleurPrises, route.cotation, route.nomOuvreur, route.nomVoie]
    .filter(Boolean)
    .join(" · ") || `Voie ${route.numeroVoieUnique || route.id}`;
}

const EMPTY_FORM = Object.freeze({
  name: "",
  description: "",
  startsOn: "",
  endsOn: "",
  color: "",
  opener: "",
  activeOnly: true,
});

export default function Challenges({ isAdmin = false }) {
  const [challenges, setChallenges] = React.useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = React.useState("");
  const [detail, setDetail] = React.useState(null);
  const [badges, setBadges] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [form, setForm] = React.useState(() => ({ ...EMPTY_FORM, startsOn: localTodayIso() }));

  const loadChallenges = React.useCallback(async (preferredId = "") => {
    setLoading(true);
    setError("");
    try {
      const [challengeList, challengeBadges] = await Promise.all([
        apiFetch("/challenges"),
        apiFetch("/challenge-badges/me"),
      ]);
      const list = Array.isArray(challengeList) ? challengeList : [];
      setChallenges(list);
      setBadges(Array.isArray(challengeBadges) ? challengeBadges : []);
      setSelectedChallengeId((current) => {
        const wanted = String(preferredId || current || "");
        if (wanted && list.some((item) => String(item.id) === wanted)) return wanted;
        return String(list[0]?.id || "");
      });
    } catch (loadError) {
      setError(String(loadError.message || loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  React.useEffect(() => {
    if (!selectedChallengeId) {
      setDetail(null);
      return;
    }
    let mounted = true;
    setDetailLoading(true);
    setError("");
    apiFetch(`/challenges/${encodeURIComponent(selectedChallengeId)}`)
      .then((value) => {
        if (mounted) setDetail(value);
      })
      .catch((loadError) => {
        if (mounted) setError(String(loadError.message || loadError));
      })
      .finally(() => {
        if (mounted) setDetailLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedChallengeId]);

  async function createNewChallenge(event) {
    event.preventDefault();
    if (saving) return;
    setMessage("");
    setError("");
    if (!form.color && !form.opener.trim()) {
      setError("Choisissez au moins une couleur ou un ouvreur.");
      return;
    }

    try {
      setSaving(true);
      const created = await apiFetch("/admin/challenges", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          startsOn: form.startsOn,
          endsOn: form.endsOn || null,
          criteria: {
            color: form.color,
            opener: form.opener,
            activeOnly: form.activeOnly,
          },
        }),
      });
      setForm({ ...EMPTY_FORM, startsOn: localTodayIso() });
      setMessage(`Challenge « ${created.name} » créé avec ${created.targetRouteCount} voie${created.targetRouteCount > 1 ? "s" : ""}.`);
      await loadChallenges(created.id);
    } catch (saveError) {
      setError(String(saveError.message || saveError));
    } finally {
      setSaving(false);
    }
  }

  async function closeSelectedChallenge() {
    if (!detail || detail.status === "closed" || closing) return;
    if (!window.confirm(`Clôturer définitivement le challenge « ${detail.name} » et attribuer le badge Challenge aux 3 premiers ?`)) return;

    setMessage("");
    setError("");
    try {
      setClosing(true);
      const closed = await apiFetch(`/admin/challenges/${encodeURIComponent(detail.id)}/close`, { method: "POST" });
      setDetail(closed);
      setMessage("Challenge clôturé. Le classement est figé et les badges ont été attribués aux 3 premiers.");
      await loadChallenges(closed.id);
    } catch (closeError) {
      setError(String(closeError.message || closeError));
    } finally {
      setClosing(false);
    }
  }

  const completedIds = new Set((detail?.myProgress?.completedRouteIds || []).map(String));

  return (
    <div className="stack challenges-page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ margin: 0 }}>Challenges</h2>
            <div className="small">Les réalisations antérieures à la date de début ne comptent pas. Une même voie ne compte qu’une fois.</div>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="group" style={{ marginTop: 12 }}>
            {badges.map((badge) => (
              <span className="pill" key={badge.id} title={badge.metadata?.challengeName || "Challenge"}>
                🏅 {badge.label} · {badge.metadata?.challengeName || "Challenge"} · #{badge.metadata?.rank || "?"}
              </span>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <details className="card">
          <summary><strong>Créer un challenge</strong></summary>
          <form className="stack" style={{ marginTop: 14 }} onSubmit={createNewChallenge}>
            <div className="form-grid">
              <label>
                Nom
                <input value={form.name} minLength={3} maxLength={120} required onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Date de début
                <input type="date" value={form.startsOn} required onChange={(event) => setForm((current) => ({ ...current, startsOn: event.target.value }))} />
              </label>
              <label>
                Date de fin (facultative)
                <input type="date" min={form.startsOn || undefined} value={form.endsOn} onChange={(event) => setForm((current) => ({ ...current, endsOn: event.target.value }))} />
              </label>
              <label>
                Couleur des prises
                <select value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}>
                  <option value="">Toutes les couleurs</option>
                  {ROUTE_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              </label>
              <label>
                Ouvreur
                <input value={form.opener} maxLength={120} placeholder="Ex. Sylvain" onChange={(event) => setForm((current) => ({ ...current, opener: event.target.value }))} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.activeOnly} onChange={(event) => setForm((current) => ({ ...current, activeOnly: event.target.checked }))} />
                Uniquement les voies actives au lancement
              </label>
            </div>
            <label>
              Description
              <textarea value={form.description} maxLength={2000} rows={3} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <div className="small">Couleur et ouvreur peuvent être combinés. Les voies correspondantes sont figées au lancement du challenge.</div>
            <Button type="submit" disabled={saving}>{saving ? "Création…" : "Créer le challenge"}</Button>
          </form>
        </details>
      )}

      {error && <div className="muted-box" role="alert">{error}</div>}
      {message && <div className="muted-box" role="status">{message}</div>}

      {loading ? (
        <div className="card"><div className="muted-box">Chargement des challenges…</div></div>
      ) : challenges.length === 0 ? (
        <div className="card"><div className="muted-box">Aucun challenge pour le moment.</div></div>
      ) : (
        <div className="card">
          <label htmlFor="challenge-select">Challenge affiché</label>
          <select id="challenge-select" value={selectedChallengeId} onChange={(event) => setSelectedChallengeId(event.target.value)}>
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.status === "closed" ? "✓ " : "▶ "}{challenge.name} — {formatDate(challenge.startsOn)}
              </option>
            ))}
          </select>
        </div>
      )}

      {detailLoading && <div className="card"><div className="muted-box">Calcul du classement…</div></div>}

      {!detailLoading && detail && (
        <>
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ margin: 0 }}>{detail.name}</h2>
                <div className="small">{challengeCriteriaLabel(detail.criteria)}</div>
              </div>
              <span className="badge">{detail.status === "closed" ? "Clôturé" : "En cours"}</span>
            </div>
            {detail.description && <p>{detail.description}</p>}
            <div className="group">
              <span className="pill">Début : {formatDate(detail.startsOn)}</span>
              {detail.endsOn && <span className="pill">Fin : {formatDate(detail.endsOn)}</span>}
              <span className="pill">{detail.targetRouteCount} voie{detail.targetRouteCount > 1 ? "s" : ""}</span>
            </div>
            {detail.myProgress && (
              <div className="muted-box" style={{ marginTop: 12 }}>
                <strong>Ma progression : {detail.myProgress.score} / {detail.targetRouteCount}</strong>
                {detail.myProgress.rank && <span> · classement #{detail.myProgress.rank}</span>}
                {detail.myProgress.challengeBadge && <span> · 🏅 Badge Challenge</span>}
              </div>
            )}
            {isAdmin && detail.status !== "closed" && (
              <div style={{ marginTop: 12 }}>
                <Button type="button" disabled={closing} onClick={closeSelectedChallenge}>
                  {closing ? "Clôture…" : "Clôturer le challenge"}
                </Button>
              </div>
            )}
          </div>

          <section className="card">
            <div className="card-header"><h3 style={{ margin: 0 }}>Classement</h3></div>
            {detail.ranking.length === 0 ? (
              <div className="muted-box">Aucune réalisation qualifiante depuis le début du challenge.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead><tr><th>Rang</th><th>Grimpeur</th><th>Voies</th><th>Récompense</th></tr></thead>
                  <tbody>
                    {detail.ranking.map((entry) => (
                      <tr key={entry.participantId}>
                        <td><strong>#{entry.rank}</strong></td>
                        <td>{entry.participantName}</td>
                        <td>{entry.score} / {detail.targetRouteCount}</td>
                        <td>{detail.status === "closed" && entry.challengeBadge ? "🏅 Challenge" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <details className="card">
            <summary><strong>Voies du challenge ({detail.targetRoutes.length})</strong></summary>
            <div className="stack" style={{ marginTop: 12 }}>
              {detail.targetRoutes.map((route) => (
                <div className="muted-box" key={route.id}>
                  {completedIds.has(String(route.id)) ? "✓ " : "○ "}{routeLabel(route)}
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
