"use client";
// FUT-50 · LE LECTEUR DU MINI-FILM « DOSSIER ADRESSE ». DEV UNIQUEMENT.
//
// LA SOLUTION TECHNIQUE RETENUE : une vidéo native, muette, sans dépendance.
//   - le film est TOURNÉ à partir des vrais composants « Le relevé » nourris par la fixture FUT-56 (une route
//     de développement qui les met en scène, enregistrée par Playwright puis encodée par ffmpeg, comme les
//     vidéos d'audit de FUT-75 et FUT-50) : aucune donnée retouchée au montage ;
//   - deux fichiers, H.264 en `.mp4` (largeur 1280, environ 1,5 Mo) et une version verticale 4:5 pour mobile ;
//   - `preload="none"` et source posée seulement à l'approche du champ de vision ;
//   - lecture automatique muette UNIQUEMENT quand la moitié du film est visible, et jamais en mouvement réduit ;
//     pause dès qu'il sort du champ ; pas de boucle : il s'arrête sur son dernier plan ;
//   - contrôles « Lire », « Pause », « Revoir » ; sous-titres WebVTT des messages des plans ;
//   - le texte des plans reste lisible sous le film : le message passe sans regarder la vidéo.
//
// Tant que le film n'existe pas (`film` nul), le lecteur montre le POSTER DE MAQUETTE, identifié comme tel,
// et aucun contrôle factice. Dans l'accueil public, la section reste absente tant que le film n'est pas validé.
import { useEffect, useRef, useState, type ReactNode } from "react";
import c from "./c.module.css";

export type Film = { mp4: string; mp4Vertical?: string; poster: string; posterVertical?: string; sousTitres?: string };

export function FilmDossier({ film, maquette, titre }: { film: Film | null; maquette: ReactNode; titre: string }) {
  const boite = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [lecture, setLecture] = useState<"arret" | "lecture" | "pause" | "fin">("arret");
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const appliquer = () => setReduit(mq.matches);
    appliquer();
    mq.addEventListener("change", appliquer);
    return () => mq.removeEventListener("change", appliquer);
  }, []);

  // Chargement différé, lecture automatique bornée, pause hors champ.
  useEffect(() => {
    if (!film || !boite.current) return;
    const vertical = window.matchMedia("(max-width: 640px)").matches;
    const obs = new IntersectionObserver(([e]) => {
      if (!e) return;
      if (e.isIntersecting && !source) setSource(vertical && film.mp4Vertical ? film.mp4Vertical : film.mp4);
      const v = video.current;
      if (!v) return;
      if (e.intersectionRatio >= 0.5 && !reduit && lecture === "arret") v.play().catch(() => {});
      if (e.intersectionRatio < 0.2 && !v.paused) v.pause();
    }, { rootMargin: "300px 0px", threshold: [0, 0.2, 0.5] });
    obs.observe(boite.current);
    return () => obs.disconnect();
  }, [film, source, reduit, lecture]);

  if (!film) {
    return (
      <div className={c.film} aria-label={`${titre} : maquette de conception, le film n'existe pas encore`}>
        {maquette}
      </div>
    );
  }

  return (
    <div className={c.film} ref={boite}>
      <video
        ref={video}
        className={c.filmVideo}
        src={source ?? undefined}
        poster={film.poster}
        muted
        playsInline
        preload="none"
        aria-label={titre}
        onPlay={() => setLecture("lecture")}
        onPause={() => setLecture((l) => (l === "fin" ? l : "pause"))}
        onEnded={() => setLecture("fin")}
      >
        {film.sousTitres ? <track kind="captions" srcLang="fr" label="Français" src={film.sousTitres} default /> : null}
      </video>
      <div className={c.filmControles}>
        {lecture === "lecture" ? (
          <button type="button" className={c.bouton} onClick={() => video.current?.pause()}>Pause</button>
        ) : lecture === "fin" ? (
          <button type="button" className={c.bouton} onClick={() => { const v = video.current; if (v) { v.currentTime = 0; v.play().catch(() => {}); } }}>Revoir</button>
        ) : (
          <button type="button" className={c.bouton} onClick={() => { if (!source) setSource(film.mp4); requestAnimationFrame(() => video.current?.play().catch(() => {})); }}>Lire</button>
        )}
      </div>
    </div>
  );
}
