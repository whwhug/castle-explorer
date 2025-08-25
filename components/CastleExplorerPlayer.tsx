"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home } from "lucide-react";

/** ——— Types ——— */
export type CTA = {
  label: string;
  goTo: "autoNext" | "home" | number | string; // index or clipId or special
};

export type Clip = {
  id: string;
  title: string;
  src: string; // MP4 or HLS
  poster?: string;
  prompt?: string; // optional
  ctas?: CTA[];    // optional
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
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [endOverlay, setEndOverlay] = useState(false);
  const [barVisible, setBarVisible] = useState(true);

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

      {/* Subtle progress line */}
      <div className="fixed left-0 right-0 bottom-0 h-0.5 bg-white/10">
        <div className="h-full bg-white/80" style={{ width: `${pct}%` }} />
      </div>

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
                (cta, i) => (
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
