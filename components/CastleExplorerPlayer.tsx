"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home, Info, X } from "lucide-react";

/** ——— Types ——— */
type GoTo = "autoNext" | "home" | number | string;

export type CTA = {
  label: string;
  goTo: GoTo; // index or clipId or special
};

type Box = { top: string; left: string; width: string; height: string };

type HotspotKF = { t: number; box: Box };

export type Hotspot = {
  // percentages relative to video viewport; simple rectangular areas OR animated path
  leftPct?: number;
  topPct?: number;
  widthPct?: number;
  heightPct?: number;
  start?: number; // seconds from start when the hotspot becomes active
  end?: number; // seconds when it disappears
  goTo: GoTo; // target clip id or index
  label?: string; // accessible label
  aria?: string; // optional explicit aria label
  path?: HotspotKF[]; // optional keyframed box path over time
};

export type Clip = {
  id: string;
  title: string;
  src: string; // MP4 or HLS
  poster?: string;
  prompt?: string; // optional
  ctas?: CTA[]; // optional
  facts?: string[]; // optional – informational bullets
  hotspots?: Hotspot[]; // optional hotspots
  modal?: {
    title: string;
    body: string; // supports \n\n for paragraphs
    linkText: string;
  };
};

export type PlayerEvent =
  | { type: "clip_loaded"; clipId: string }
  | { type: "play" | "pause"; clipId: string; position: number }
  | { type: "clip_ended"; clipId: string }
  | { type: "cta_click"; clipId: string; label: string };

/** ——— Component ——— */
export default function CastleExplorerPlayer({
  title = "Castle Explorer",
  playlist = [],
  autoAdvance = false,
  showBar = true,
  onEvent = () => {},
}: {
  title?: string;
  playlist: Clip[];
  autoAdvance?: boolean;
  showBar?: boolean;
  onEvent?: (evt: PlayerEvent) => void;
}) {
  const [index, setIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [_playing, setPlaying] = useState(false); // prefixed to satisfy no-unused-vars when not referenced
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [endOverlay, setEndOverlay] = useState(false);
  const [barVisible, setBarVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<number | null>(null);

  const current = playlist[index];

  /** Load / wire media on clip change */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = current.src.endsWith(".m3u8");
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(current.src);
      hls.attachMedia(video);
    } else {
      video.src = current.src;
    }

    video.poster = current.poster || "";
    video.load();
    setProgress(0);
    setDuration(0);
    setEndOverlay(false);

    const onLoadedMeta = () => {
      setDuration(video.duration || 0);
      if (hasStarted) {
        setTimeout(() => video.play().catch(() => {}), 0);
        setPlaying(true);
      }
      onEvent({ type: "clip_loaded", clipId: current.id });
    };

    const onTimeUpdate = () => setProgress(video.currentTime || 0);

    const onEnded = () => {
      onEvent({ type: "clip_ended", clipId: current.id });
      if (autoAdvance && index < playlist.length - 1) {
        setIndex(index + 1);
      } else {
        setPlaying(false);
        setEndOverlay(true);
      }
    };

    video.addEventListener("loadedmetadata", onLoadedMeta);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMeta);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.src, hasStarted]);

  /** Auto-hide top bar */
  useEffect(() => {
    if (!showBar) return;
    const onMove = () => {
      setBarVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setBarVisible(false), 1600);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchstart", onMove);
    onMove();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [showBar]);

  // Keyboard shortcut for Info drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "i") setInfoOpen((v) => !v);
      if (e.key === "Escape") {
        setInfoOpen(false);
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Controls */
  function play() {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
    setPlaying(true);
    setEndOverlay(false);
    onEvent({ type: "play", clipId: current.id, position: v.currentTime || 0 });
  }
  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) play();
    else {
      v.pause();
      setPlaying(false);
      onEvent({ type: "pause", clipId: current.id, position: v.currentTime || 0 });
    }
  }
  function goNext() {
    if (index < playlist.length - 1) setIndex(index + 1);
  }
  function jumpTo(i: number) {
    if (i >= 0 && i < playlist.length) setIndex(i);
  }
  function goHome() {
    const v = videoRef.current;
    if (v) v.pause();
    setPlaying(false);
    setEndOverlay(false);
    setIndex(0);
    setHasStarted(false);
  }
  function handleCta(cta: CTA) {
    onEvent({ type: "cta_click", clipId: current.id, label: cta.label });
    if (cta.goTo === "home") return goHome();
    if (cta.goTo === "autoNext") return goNext();
    if (typeof cta.goTo === "number") return jumpTo(cta.goTo);
    if (typeof cta.goTo === "string") {
      const idx = playlist.findIndex((c) => c.id === cta.goTo);
      if (idx >= 0) return jumpTo(idx);
    }
  }

  const pct = useMemo(() => (duration ? (progress / duration) * 100 : 0), [progress, duration]);
  const shouldPulseInfo = !!current?.modal && !infoOpen;

  /** ——— Render ——— */
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Top bar (clickable Home) */}
      {showBar && (
        <div
          className={`pointer-events-none fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 transition-opacity duration-300 ${
            barVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto">
            <button
              onClick={goHome}
              className="inline-flex items-center gap-2 h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm"
              aria-label="Home"
              title="Back to start"
            >
              <Home className="h-4 w-4" />
              <span className="font-medium tracking-tight">{title}</span>
            </button>
          </div>
          <div className="pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              className={`h-8 rounded-xl border-white/10 bg-white/10 hover:bg-white/20 ${
                shouldPulseInfo ? "animate-pulse bg-amber-300/20 hover:bg-amber-300/30 border-amber-300/50" : ""
              }`}
              onClick={() => setInfoOpen((v) => !v)}
              aria-pressed={infoOpen}
              aria-label="Toggle info (i)"
              title="Toggle info (i)"
            >
              {infoOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Info className={`h-4 w-4 ${shouldPulseInfo ? "text-amber-300" : ""}`} />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Full-bleed video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        poster={current?.poster}
        aria-label={current?.title || "Video"}
        onClick={toggle}
      />

      {/* Clickable hotspots (time-windowed) */}
      {current?.hotspots?.map((h: Hotspot, i: number) => {
        const active = (h.start == null || progress >= h.start) && (h.end == null || progress <= h.end);
        if (!active) return null;

        // If using static percentage rects
        if (h.leftPct != null && h.topPct != null && h.widthPct != null && h.heightPct != null) {
          const style: React.CSSProperties = {
            left: `${h.leftPct}%`,
            top: `${h.topPct}%`,
            width: `${h.widthPct}%`,
            height: `${h.heightPct}%`,
          };
          return (
            <button
              key={i}
              className="absolute z-30 border-2 border-white/30 hover:border-white/60 rounded-md bg-white/5 transition-colors"
              style={style}
              aria-label={h.aria ?? h.label ?? "Hotspot"}
              onClick={() => handleCta({ label: h.label ?? "Hotspot", goTo: h.goTo })}
            />
          );
        }

        // (Optional) if using animated path boxes, compute a box from h.path and render similarly.
        return null;
      })}

      {/* Subtle progress line */}
      <div className="fixed left-0 right-0 bottom-0 h-0.5 bg-white/10">
        <div className="h-full bg-white/80" style={{ width: `${pct}%` }} />
      </div>

      {/* Info panel (right slide-in) */}
      {current?.facts?.length ? (
        <div
          className={`absolute top-14 right-4 z-40 w-80 max-w-[85vw] transition-transform duration-300 ${
            infoOpen ? "translate-x-0" : "translate-x-4 pointer-events-none opacity-0"
          }`}
        >
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="text-sm font-semibold mb-2">{current.title}</div>
            <ul className="space-y-2 pr-1">
              {current.facts.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/90">
                  <span className="text-white/60">•</span>
                  <span>{f}</span>
                </li>
              ))}
              {current.modal ? (
                <li className="mt-3">
                  <div className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-3">
                    <div className="text-sm text-amber-200 mb-2">{current.modal.linkText}</div>
                    <Button
                      size="sm"
                      className="rounded-lg h-8 bg-amber-300 text-black hover:bg-amber-200"
                      onClick={() => setModalOpen(true)}
                    >
                      Find out more
                    </Button>
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Fullscreen modal for extended reading */}
      {modalOpen && current?.modal ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="min-h-dvh p-4 md:p-6">
            <div className="relative bg-black/60 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl min-h-[90dvh]">
              <button
                className="absolute right-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-white/90">
                {current.modal.body.split("\n\n").map((block, i) => {
                  const trimmed = block.trim();
                  const isH2 = /^\*\*([\s\S]+)\*\*$/.test(trimmed);
                  const isH3 = /^\*([^*][\s\S]+)\*$/.test(trimmed);
                  if (isH2) {
                    const t = trimmed.replace(/^\*\*|\*\*$/g, "");
                    return (
                      <h2 key={i} className="text-xl font-semibold mb-3 tracking-tight">
                        {t}
                      </h2>
                    );
                  }
                  if (isH3) {
                    const heading = trimmed.replace(/^\*|\*$/g, "");
                    return (
                      <h3 key={i} className="text-sm font-semibold uppercase tracking-wide text-white/80 mt-5 mb-2">
                        {heading}
                      </h3>
                    );
                  }
                  return (
                    <p key={i} className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                      {block}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Start screen (single click → autoplay allowed) */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <Button
            size="lg"
            className="rounded-xl px-6 py-6 text-base"
            onClick={() => {
              setHasStarted(true);
              setTimeout(() => play(), 0);
            }}
          >
            Start <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* End overlay – bottom-right CTAs */}
      {hasStarted && endOverlay && (
        <div className="absolute z-40 bottom-6 right-6">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3">
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              {(current?.ctas?.length ? current.ctas : [{ label: "Continue", goTo: "autoNext" }]).map(
                (cta: CTA, i: number) => (
                  <Button key={i} size="lg" className="rounded-xl" onClick={() => handleCta(cta)}>
                    {cta.label} <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
