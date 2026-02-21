import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Headphones, Play, Pause, Square, Loader2 } from "lucide-react";
import type { PortfolioHolding } from "@/data/portfolioHoldings";

const API_BASE = "http://localhost:8000";

interface Props {
  holdings: PortfolioHolding[];
  onClose: () => void;
}

// The 3 fixed briefing modes
const BRIEFING_MODES = [
  {
    id: "2min",
    label: "2 min",
    title: "Portfolio Snapshot",
    description: "What you own right now — values, allocation & performance at a glance.",
    emoji: "📊",
    minutes: 2,
  },
  {
    id: "10min",
    label: "10 min",
    title: "Holdings Analysis",
    description: "Your holdings explained: where each position stands and the key reasons behind the moves.",
    emoji: "🔍",
    minutes: 10,
  },
  {
    id: "30min",
    label: "30 min",
    title: "Macro Intelligence Report",
    description: "The full picture: global macro events, how they connect to your specific stocks and what it means for you.",
    emoji: "🌐",
    minutes: 30,
  },
] as const;

type BriefingModeId = (typeof BRIEFING_MODES)[number]["id"];
type PlayState = "idle" | "generating" | "ready" | "playing" | "paused";

async function fetchPortfolioScript(
  holdings: PortfolioHolding[],
  mode: BriefingModeId,
): Promise<string> {
  const res = await fetch(`${API_BASE}/portfolio-audio-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holdings, mode, user_id: "mock_user_1" }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.script as string;
}

async function fetchAudioBlob(script: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/audio-tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, voice_style: "neutral", user_id: "mock_user_1" }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

const PortfolioAudioSummarySheet = ({ holdings, onClose }: Props) => {
  const [selectedMode, setSelectedMode] = useState<BriefingModeId>("2min");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setPlayState("ready");
    setElapsed(0);
  }, []);

  const backToSelect = useCallback(() => {
    stopPlayback();
    setPlayState("idle");
    setTranscript("");
    setAudioUrl(null);
    setError(null);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
  }, [stopPlayback]);

  const handleGenerate = useCallback(async () => {
    setPlayState("generating");
    setError(null);
    try {
      const script = await fetchPortfolioScript(holdings, selectedMode);
      setTranscript(script);
      const url = await fetchAudioBlob(script);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;
      setAudioUrl(url);
      setPlayState("ready");
    } catch (err) {
      setError(`Could not reach the backend. ${err instanceof Error ? err.message : "Unknown error"}`);
      setPlayState("idle");
    }
  }, [holdings, selectedMode]);

  const startPlayback = useCallback(() => {
    if (!transcript) return;
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setPlayState("playing");
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 1;
      utterance.onstart = () => {
        setPlayState("playing");
        const start = Date.now();
        timerRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
      };
      utterance.onend = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlayState("ready");
        setElapsed(0);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [audioUrl, transcript]);

  const togglePause = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (playState === "playing") { audioRef.current.pause(); setPlayState("paused"); }
      else if (playState === "paused") { audioRef.current.play(); setPlayState("playing"); }
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (playState === "playing") {
        window.speechSynthesis.pause(); setPlayState("paused");
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (playState === "paused") {
        window.speechSynthesis.resume(); setPlayState("playing");
      }
    }
  }, [playState, audioUrl]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setElapsed(Math.floor(audioRef.current.currentTime));
  }, []);

  const handleEnded = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlayState("ready"); setElapsed(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setAudioDuration(Math.floor(audioRef.current.duration));
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const progressPct = audioDuration > 0 ? Math.min((elapsed / audioDuration) * 100, 100) : 0;
  const usingBrowserTTS = playState !== "idle" && playState !== "generating" && !audioUrl;
  const isPlayingOrPaused = playState === "playing" || playState === "paused";
  const isReadyOrPlaying = playState === "ready" || isPlayingOrPaused;

  const activeMode = BRIEFING_MODES.find((m) => m.id === selectedMode)!;

  const statusLine = (() => {
    switch (playState) {
      case "idle":       return "";
      case "generating": return `Generating your ${activeMode.minutes}-minute briefing with AI…`;
      case "ready":      return usingBrowserTTS ? "Ready — using device voice." : "Your briefing is ready to play.";
      case "playing":    return `Playing: ${formatTime(elapsed)}${audioDuration ? ` / ${formatTime(audioDuration)}` : ""}`;
      case "paused":     return `Paused at ${formatTime(elapsed)}`;
    }
  })();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-2xl border-t border-border px-5 pt-5 pb-8 flex flex-col"
          style={{ maxHeight: "min(88vh, 720px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hidden audio */}
          <audio
            ref={audioRef}
            src={audioUrl ?? ""}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={handleLoadedMetadata}
            preload="auto"
            style={{ display: "none" }}
          />

          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <Headphones size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">Portfolio Briefing</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {isReadyOrPlaying ? (
              /* Playback view */
              <div className="flex flex-col items-center py-4 px-2">
                <p className="text-sm font-semibold text-foreground mb-4">{activeMode.title}</p>

                {/* Waveform */}
                <div className="flex items-center gap-0.5 h-8 mb-5">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary/60 rounded-full"
                      animate={playState === "playing" ? {
                        height: [
                          `${4 + Math.sin(i * 0.5) * 12}px`,
                          `${4 + Math.cos(i * 0.3) * 18}px`,
                          `${4 + Math.sin(i * 0.5) * 12}px`,
                        ],
                      } : {}}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.03 }}
                      style={{ height: `${Math.max(4, Math.sin(i * 0.5) * 20 + 8)}px` }}
                    />
                  ))}
                </div>

                {/* Progress bar */}
                {audioDuration > 0 && (
                  <div className="w-full mb-4">
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{formatTime(elapsed)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                )}

                {transcript && (
                  <div className="bg-secondary rounded-xl p-3 w-full">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">Script preview</p>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-5">{transcript}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Mode selection */
              <div className="space-y-2 mb-2">
                {BRIEFING_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    disabled={playState === "generating"}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left ${
                      selectedMode === mode.id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-secondary border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{mode.title}</span>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ${
                      selectedMode === mode.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground border border-border"
                    }`}>
                      ~{mode.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 pt-3 border-t border-border/40">
            {statusLine && <p className="text-xs text-muted-foreground text-center mb-3">{statusLine}</p>}
            {error && <p className="text-xs text-red-400 text-center mb-2">{error}</p>}

            {playState === "idle" && (
              <button
                onClick={handleGenerate}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Headphones size={16} />
                Generate &amp; Play
              </button>
            )}

            {playState === "generating" && (
              <button disabled className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-70">
                <Loader2 size={16} className="animate-spin" />
                Generating briefing…
              </button>
            )}

            {playState === "ready" && (
              <div className="space-y-2">
                <button
                  onClick={startPlayback}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Play size={16} className="ml-0.5" />
                  Play briefing
                </button>
                <button onClick={backToSelect} className="w-full bg-secondary text-foreground py-3 rounded-xl text-sm font-medium">
                  Choose another format
                </button>
              </div>
            )}

            {isPlayingOrPaused && (
              <div className="flex gap-2">
                <button
                  onClick={togglePause}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {playState === "playing" ? <><Pause size={16} /> Pause</> : <><Play size={16} className="ml-0.5" /> Resume</>}
                </button>
                <button
                  onClick={stopPlayback}
                  className="w-14 bg-secondary text-foreground rounded-xl flex items-center justify-center"
                >
                  <Square size={16} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PortfolioAudioSummarySheet;
