import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Headphones, Play, Pause, Square, Loader2, Mic, Zap, BookOpen } from "lucide-react";
import type { MarketStory } from "@/data/marketStories";
import SourceLogo from "@/components/SourceLogo";

interface AudioSummarySheetProps {
  stories: MarketStory[];
  onClose: () => void;
}

const API_BASE = "http://localhost:8000";

const durations = [
  { label: "1 min", value: "1" },
  { label: "5 min", value: "5" },
  { label: "10 min", value: "10" },
  { label: "Auto", value: "auto" },
];

type VoiceStyle = "neutral" | "energetic" | "calm";

const voiceStyles: { id: VoiceStyle; label: string; subtitle: string; icon: React.ReactNode }[] = [
  { id: "neutral",   label: "Neutral Analyst",  subtitle: "Balanced · Clear",  icon: <Mic size={20} /> },
  { id: "energetic", label: "Energetic Host",    subtitle: "Upbeat · Dynamic",  icon: <Zap size={20} /> },
  { id: "calm",      label: "Calm Economist",    subtitle: "Measured · Deep",   icon: <BookOpen size={20} /> },
];

type PlayState = "idle" | "generating" | "ready" | "playing" | "paused";

async function fetchAIScript(
  stories: MarketStory[],
  selectedIds: Set<string>,
  duration: string
): Promise<string> {
  const selected = stories.filter((s) => selectedIds.has(s.id));
  const res = await fetch(`${API_BASE}/audio-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stories: selected.map((s) => ({
        id: s.id,
        label: s.label,
        slides: s.slides.map((sl) => ({
          headline: sl.headline,
          body: sl.body,
          source: sl.source,
        })),
      })),
      duration,
      user_id: "mock_user_1",
    }),
  });
  if (!res.ok) throw new Error("Failed to generate script");
  const data = await res.json();
  return data.script as string;
}

async function fetchAudioBlob(script: string, voiceStyle: VoiceStyle): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/audio-tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, voice_style: voiceStyle, user_id: "mock_user_1" }),
    });
    if (!res.ok) return null;   // fall back to browser TTS silently
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;  // network error — fall back to browser TTS
  }
}

const AudioSummarySheet = ({ stories, onClose }: AudioSummarySheetProps) => {
  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set(stories.map((s) => s.id))
  );
  const [duration, setDuration] = useState("auto");
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("energetic");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URL and audio on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const toggleStory = (id: string) => {
    setSelectedStories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStories.size === stories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(stories.map((s) => s.id)));
    }
  };

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setPlayState("ready");
    setElapsed(0);
  }, []);

  const backToSelect = useCallback(() => {
    stopPlayback();
    setPlayState("idle");
    setTranscript("");
    setAudioUrl(null);
    setGenerateError(null);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [stopPlayback]);

  const handleGenerate = useCallback(async () => {
    if (selectedStories.size === 0) return;
    setPlayState("generating");
    setGenerateError(null);
    try {
      // Step 1: generate text script via LLM
      const script = await fetchAIScript(stories, selectedStories, duration);
      setTranscript(script);

      // Step 2: try Groq TTS; falls back to browser speech synthesis if unavailable
      const url = await fetchAudioBlob(script, voiceStyle);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;
      setAudioUrl(url);  // null = use browser TTS fallback
      setPlayState("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setGenerateError(`Couldn't reach the backend. ${msg}`);
      setPlayState("idle");
    }
  }, [stories, selectedStories, duration, voiceStyle]);

  const startPlayback = useCallback(() => {
    if (!transcript) return;

    if (audioUrl && audioRef.current) {
      // Real Groq TTS audio
      audioRef.current.play();
      setPlayState("playing");
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Fallback: browser speech synthesis
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 1;
      utterance.onstart = () => {
        setPlayState("playing");
        const start = Date.now();
        timerRef.current = window.setInterval(() => {
          setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 500);
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
      if (playState === "playing") {
        audioRef.current.pause();
        setPlayState("paused");
      } else if (playState === "paused") {
        audioRef.current.play();
        setPlayState("playing");
      }
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (playState === "playing") {
        window.speechSynthesis.pause();
        setPlayState("paused");
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (playState === "paused") {
        window.speechSynthesis.resume();
        setPlayState("playing");
      }
    }
  }, [playState, audioUrl]);

  const handleAudioTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setElapsed(Math.floor(audioRef.current.currentTime));
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlayState("ready");
    setElapsed(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const handleAudioLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(Math.floor(audioRef.current.duration));
    }
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const usingBrowserTTS = playState !== "idle" && playState !== "generating" && !audioUrl;

  const statusLine = (() => {
    switch (playState) {
      case "idle":       return "Choose topics and voice to generate your briefing.";
      case "generating": return "Generating your script with Groq AI…";
      case "ready":      return usingBrowserTTS ? "Ready — using device voice (accept Groq TTS terms for AI voice)." : "Your audio briefing is ready.";
      case "playing":    return `Now playing: ${formatTime(elapsed)}${audioDuration ? ` / ${formatTime(audioDuration)}` : ""}`;
      case "paused":     return `Paused at ${formatTime(elapsed)}`;
    }
  })();

  const isPlayingOrPaused = playState === "playing" || playState === "paused";
  const isReadyOrPlaying = playState === "ready" || isPlayingOrPaused;

  const getStorySource = (story: MarketStory) => {
    const slide = story.slides[0];
    if (!slide) return { name: story.label, domain: undefined };
    const sourceDomainMap: Record<string, string> = {
      Reuters: "reuters.com",
      Bloomberg: "bloomberg.com",
      "World Gold Council": "gold.org",
      "NVIDIA IR": "nvidia.com",
      MarketWatch: "marketwatch.com",
      Eurostat: "ec.europa.eu",
      BLS: "bls.gov",
      ECB: "ecb.europa.eu",
      "Federal Reserve": "federalreserve.gov",
      CoinDesk: "coindesk.com",
      Etherscan: "etherscan.io",
      CNBC: "cnbc.com",
      "Goldman Sachs": "goldmansachs.com",
      "Portfolio Analysis": undefined,
      "Shibarium Explorer": undefined,
    };
    return { name: slide.source, domain: sourceDomainMap[slide.source] };
  };

  // Progress bar fill %
  const progressPct = audioDuration > 0 ? Math.min((elapsed / audioDuration) * 100, 100) : 0;

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
          style={{ maxHeight: "min(85vh, 680px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hidden audio element — lives inside the sheet so it's always in-tree */}
          <audio
            ref={audioRef}
            src={audioUrl ?? ""}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
            onLoadedMetadata={handleAudioLoadedMetadata}
            preload="auto"
            style={{ display: "none" }}
          />
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <Headphones size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">Audio summary</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable middle — ONLY the story list scrolls */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {(playState === "idle" || playState === "generating") ? (
              <>
                {/* Story selection — this part scrolls */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Select stories</p>
                    <button onClick={toggleAll} className="text-xs text-primary font-medium">
                      {selectedStories.size === stories.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {stories.map((story) => {
                      const isSelected = selectedStories.has(story.id);
                      const src = getStorySource(story);
                      return (
                        <button
                          key={story.id}
                          onClick={() => toggleStory(story.id)}
                          disabled={playState === "generating"}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-secondary border border-transparent"
                          }`}
                        >
                          <SourceLogo name={src.name} domain={src.domain} size={36} />
                          <span className="text-sm font-medium text-foreground flex-1 text-left">
                            {story.label}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">
                            {story.slides.length} {story.slides.length === 1 ? "slide" : "slides"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "bg-primary" : "border-2 border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : isReadyOrPlaying ? (
              /* Playback state */
              <div className="flex flex-col items-center py-4 px-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Headphones size={28} className="text-primary" />
                </div>

                {/* Waveform animation */}
                <div className="flex items-center gap-0.5 h-8 mb-5">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary/60 rounded-full"
                      animate={
                        playState === "playing"
                          ? {
                              height: [
                                `${4 + Math.sin(i * 0.5) * 12}px`,
                                `${4 + Math.cos(i * 0.3) * 18}px`,
                                `${4 + Math.sin(i * 0.5) * 12}px`,
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.03 }}
                      style={{
                        height: `${Math.max(4, Math.sin(i * 0.5) * 20 + 8)}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Progress bar */}
                {audioDuration > 0 && (
                  <div className="w-full mb-4">
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{formatTime(elapsed)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                )}

                {/* Transcript preview */}
                {transcript && (
                  <div className="bg-secondary rounded-xl p-3 w-full">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">Script preview</p>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-4">{transcript}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Length + Voice Style — always visible, never scroll away */}
          {(playState === "idle" || playState === "generating") && (
            <div className="shrink-0 pt-3">
              {/* Duration selection */}
              <div className="mb-3">
                <p className="text-sm font-medium text-foreground mb-2">Length</p>
                <div className="flex bg-secondary rounded-lg p-1">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      disabled={playState === "generating"}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                        duration === d.value ? "bg-card text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice style selection */}
              <div className="mb-3">
                <p className="text-sm font-medium text-foreground mb-2">Voice Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {voiceStyles.map((vs) => (
                    <button
                      key={vs.id}
                      onClick={() => setVoiceStyle(vs.id)}
                      disabled={playState === "generating"}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-colors ${
                        voiceStyle === vs.id
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-secondary border-transparent text-muted-foreground"
                      }`}
                    >
                      {vs.icon}
                      <span className="text-xs font-semibold text-center leading-tight">
                        {vs.label}
                      </span>
                      <span className="text-[10px] opacity-70 text-center leading-tight">
                        {vs.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA — always pinned at bottom, never scrolls away */}
          <div className="shrink-0 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center mb-3">{statusLine}</p>
            {generateError && (
              <p className="text-xs text-red-400 text-center mb-2">{generateError}</p>
            )}

            {/* idle: generate button */}
            {playState === "idle" && (
              <button
                onClick={handleGenerate}
                disabled={selectedStories.size === 0}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Headphones size={16} />
                Generate &amp; Play
              </button>
            )}

            {/* generating: spinner */}
            {playState === "generating" && (
              <button disabled className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-70">
                <Loader2 size={16} className="animate-spin" />
                Generating audio…
              </button>
            )}

            {/* ready: big play button */}
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
                  Generate another
                </button>
              </div>
            )}

            {/* playing / paused: pause + stop side by side */}
            {isPlayingOrPaused && (
              <div className="flex gap-2">
                <button
                  onClick={togglePause}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {playState === "playing" ? (
                    <><Pause size={16} /> Pause</>
                  ) : (
                    <><Play size={16} className="ml-0.5" /> Resume</>
                  )}
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

export default AudioSummarySheet;
