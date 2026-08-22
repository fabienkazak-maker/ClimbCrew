import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_VIDEO_SRC = "/media/climbcrew-startup.mp4";
const EXIT_DURATION_MS = 260;
const SAFETY_TIMEOUT_MS = 8000;

export default function StartupVideoGate({ children }) {
  const [showIntro, setShowIntro] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const appRef = useRef(null);
  const finishingRef = useRef(false);
  const exitTimerRef = useRef(null);

  const finishIntro = useCallback(() => {
    if (finishingRef.current) return;

    finishingRef.current = true;
    setIsLeaving(true);
    exitTimerRef.current = window.setTimeout(() => {
      setShowIntro(false);
    }, EXIT_DURATION_MS);
  }, []);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.inert = showIntro;
    }
    document.body.classList.toggle("startup-video-active", showIntro);

    return () => {
      if (appRef.current) {
        appRef.current.inert = false;
      }
      document.body.classList.remove("startup-video-active");
    };
  }, [showIntro]);

  useEffect(() => {
    if (!showIntro) return undefined;

    const safetyTimer = window.setTimeout(finishIntro, SAFETY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(safetyTimer);
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, [finishIntro, showIntro]);

  return (
    <>
      <div
        ref={appRef}
        className="startup-video-app"
        aria-hidden={showIntro ? "true" : undefined}
      >
        {children}
      </div>

      {showIntro ? (
        <div
          className={`startup-video${isLeaving ? " startup-video--leaving" : ""}`}
          aria-label="Vidéo d'introduction ClimbCrew"
        >
          <video
            className="startup-video__media"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finishIntro}
            onError={finishIntro}
          >
            <source src={INTRO_VIDEO_SRC} type="video/mp4" />
          </video>

          <button
            className="startup-video__skip"
            type="button"
            onClick={finishIntro}
          >
            Passer
          </button>
        </div>
      ) : null}
    </>
  );
}
