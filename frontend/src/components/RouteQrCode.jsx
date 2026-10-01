import React from "react";
import Button from "./Button.jsx";
import { formatRouteName, normalizeRopeNumber } from "../lib/domain.js";

export function routeQrPayload(routeId) {
  return `climbcrew:voie:${encodeURIComponent(String(routeId || ""))}`;
}

export function routeQrImageUrl(routeId, size = 220) {
  const payload = routeQrPayload(routeId);
  return `https://quickchart.io/qr?size=${size}&margin=2&text=${encodeURIComponent(payload)}`;
}

export default function RouteQrCode({ route, onClose }) {
  if (!route) return null;
  const imageUrl = routeQrImageUrl(route.id, 260);
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="QR code de la voie">
      <div className="modal-panel route-qr-modal">
        <div className="card-header">
          <div>
            <h2>QR code de la voie</h2>
            <div className="small">Corde {normalizeRopeNumber(route.numeroCorde)} · {route.cotationAjustee} · {formatRouteName(route)}</div>
          </div>
          <Button variant="dangerGhost" className="modal-close" onClick={onClose} aria-label="Fermer">×</Button>
        </div>
        <div className="route-qr-content">
          <img src={imageUrl} alt={`QR code de ${formatRouteName(route)}`} width="260" height="260" />
          <div className="small">Le QR code contient uniquement l’identifiant technique de la voie.</div>
          <a className="qr-download-link" href={imageUrl} download={`climbcrew-voie-${route.id}.png`}>Télécharger le QR code</a>
        </div>
      </div>
    </div>
  );
}
