/**
 * AudioSummarySheet.tsx
 * Financial Radio — Radio & Podcast modes with Groq LLM + Web Speech API.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Headphones, Play, Pause, Square,
  Loader2, Wand2, SkipBack, SkipForward, ChevronDown, ChevronUp,
} from "lucide-react";
import type { MarketStory } from "@/data/marketStories";
import SourceLogo from "@/components/SourceLogo";
import { GROQ_API_KEY, DURATIONS } from "@/lib/audioScriptGenerator";
import { generateRadioScript, RADIO_VOICES, getRadioVoice, type RadioVoiceId } from "@/lib/radioGenerator";
import { generatePodcastScript, PERSONAS, getPersona } from "@/lib/podcastGenerator";
import type { GeneratedScript, ScriptSegment } from "@/lib/audioScriptGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode       = "radio" | "podcast";
type PlayState  = "idle" | "generating" | "ready" | "playing" | "paused";

interface AudioSummarySheetProps {
  stories: MarketStory[];
  onClose: () => void;
}

// ─── Web Speech helpers ───────────────────────────────────────────────────────

function getEngVoices(): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices();
  const eng = all.filter((v) => v.lang.startsWith("en"));
  return eng.length ? eng : all;
}

function assignPodcastVoices(): Map<string, SpeechSynthesisVoice | null> {
  const voices = getEngVoices();
  const map = new Map<string, SpeechSynthesisVoice | null>();
  const personas = PERSONAS.map((p) => p.id);
  // Try to pick 3 distinct voices; cycle if fewer available
  personas.forEach((id, i) => {
    map.set(id, voices[i % Math.max(voices.length, 1)] ?? null);
  });
  map.set("Disclaimer", voices[Math.min(2, voices.length - 1)] ?? null);
  return map;
}

// ─── Helper components ────────────────────────────────────────────────────────

const SpeakerBadge = ({ speaker, emoji }: { speaker: string; emoji: string }) => {
  const persona = getPersona(speaker);
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    Analyst:    { bg: "rgba(0,212,168,0.12)",  border: "rgba(0,212,168,0.35)",  text: "#00D4A8" },
    Investor:   { bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.35)", text: "#60A5FA" },
    Strategist: { bg: "rgba(167,139,250,0.12)",border: "rgba(167,139,250,0.35)",text: "#A78BFA" },
    Presenter:  { bg: "rgba(0,212,168,0.12)",  border: "rgba(0,212,168,0.35)",  text: "#00D4A8" },
    Disclaimer: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", text: "#F59E0B" },
  };
  const c = colors[speaker] ?? colors.Presenter;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <span>{emoji}</span>
      <span>{speaker === "Presenter" ? "Your Host" : persona.label ?? speaker}</span>
    </div>
  );
};

const Waveform = ({ playing }: { playing: boolean }) => (
  <div className="flex items-center gap-0.5 h-10">
    {Array.from({ length: 34 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-1 rounded-full"
        style={{ background: "rgba(0,212,168,0.65)" }}
        animate={
          playing
            ? {
                height: [
                  `${5 + Math.abs(Math.sin(i * 0.65)) * 16}px`,
                  `${5 + Math.abs(Math.cos(i * 0.42)) * 22}px`,
                  `${5 + Math.abs(Math.sin(i * 0.65)) * 16}px`,
                ],
              }
            : { height: `${Math.max(4, Math.abs(Math.sin(i * 0.5)) * 12 + 4)}px` }
        }
        transition={{ duration: 1.0 + (i % 3) * 0.15, repeat: Infinity, delay: i * 0.022 }}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AudioSummarySheet = ({ stories, onClose }: AudioSummarySheetProps) => {
  // Config state
  const [mode, setMode]             = useState<Mode>("radio");
  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set(stories.map((s) => s.id))
  );
  const [duration, setDuration]     = useState("auto");
  const [radioVoice, setRadioVoice] = useState<RadioVoiceId>(RADIO_VOICES[0].id);

  // Playback state
  const [playState, setPlayState]   = useState<PlayState>("idle");
  const [script, setScript]         = useState<GeneratedScript | null>(null);
  const [currentSeg, setCurrentSeg] = useState(0);
  const [elapsed, setElapsed]       = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [statusMsg, setStatusMsg]   = useState("");

  // Refs (avoid stale closures in speech callbacks)
  const segIndexRef   = useRef(0);
  const scriptRef     = useRef<GeneratedScript | null>(null);
  const timerRef      = useRef<number | null>(null);
  const startTimeRef  = useRef(0);
  const voiceMapRef   = useRef<Map<string, SpeechSynthesisVoice | null>>(new Map());
  const pausedRef     = useRef(false);

  const hasKey = GROQ_API_KEY.length > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer helpers ───────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, [elapsed]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Stop everything ─────────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    pausedRef.current = false;
  }, []);

  // ── Story selection ─────────────────────────────────────────────────────────

  const toggleStory = (id: string) =>
    setSelectedStories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedStories(
      selectedStories.size === stories.length
        ? new Set()
        : new Set(stories.map((s) => s.id))
    );

  // ── Generate script ─────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (selectedStories.size === 0) return;
    stopAll();
    setCurrentSeg(0);
    setElapsed(0);
    setPlayState("generating");
    setStatusMsg(
      hasKey
        ? mode === "radio"
          ? "Writing radio script with Llama…"
          : "Writing podcast conversation with Llama…"
        : "Generating script…"
    );

    try {
      const generated =
        mode === "radio"
          ? await generateRadioScript(stories, selectedStories, duration, radioVoice)
          : await generatePodcastScript(stories, selectedStories, duration);

      scriptRef.current = generated;
      setScript(generated);
      setPlayState("ready");
      setStatusMsg(
        hasKey
          ? `${generated.segments.length} segments · ~${Math.round(generated.wordCount / 130)} min`
          : `${generated.segments.length} segments ready`
      );
    } catch (err) {
      console.error("[AudioSheet] generation error:", err);
      setPlayState("idle");
      setStatusMsg("Something went wrong — please try again.");
    }
  }, [stories, selectedStories, duration, mode, radioVoice, hasKey, stopAll]);

  // ── Playback core ───────────────────────────────────────────────────────────

  const speakSegment = useCallback(
    (index: number) => {
      const segs = scriptRef.current?.segments ?? [];
      if (index >= segs.length) {
        // All done
        stopAll();
        setPlayState("ready");
        setCurrentSeg(0);
        setElapsed(0);
        return;
      }

      const seg: ScriptSegment = segs[index];
      segIndexRef.current = index;
      setCurrentSeg(index);

      if (!("speechSynthesis" in window)) {
        // No speech API — just advance segments visually every ~3s
        setTimeout(() => {
          if (!pausedRef.current) speakSegment(index + 1);
        }, 3000);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(seg.text);

      // Voice assignment
      if (mode === "radio") {
        const rVoice = getRadioVoice(radioVoice);
        const eng    = getEngVoices();
        if (eng.length) utterance.voice = eng[0];
        utterance.rate  = rVoice.rate;
        utterance.pitch = seg.speaker === "Disclaimer" ? 0.85 : rVoice.pitch;
        utterance.volume = seg.speaker === "Disclaimer" ? 0.75 : 1;
      } else {
        // Podcast: different voice per persona
        const assigned = voiceMapRef.current.get(seg.speaker);
        if (assigned) utterance.voice = assigned;
        utterance.rate  = seg.speaker === "Investor" ? 1.05 : seg.speaker === "Strategist" ? 0.93 : 1.0;
        utterance.pitch = seg.speaker === "Investor" ? 1.08 : seg.speaker === "Strategist" ? 0.92 : 1.0;
        utterance.volume = seg.speaker === "Disclaimer" ? 0.7 : 1;
      }

      utterance.onend = () => {
        if (!pausedRef.current) speakSegment(index + 1);
      };

      utterance.onerror = () => {
        // Skip broken segment and continue
        if (!pausedRef.current) speakSegment(index + 1);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [mode, radioVoice, stopAll]
  );

  // ── Start Listening ─────────────────────────────────────────────────────────

  const handleStartListening = useCallback(() => {
    if (!scriptRef.current) return;

    // Pre-load podcast voices
    if (mode === "podcast") {
      voiceMapRef.current = assignPodcastVoices();
    }

    pausedRef.current = false;
    segIndexRef.current = 0;
    setCurrentSeg(0);
    setElapsed(0);
    setPlayState("playing");
    startTimer();
    speakSegment(0);
  }, [mode, startTimer, speakSegment]);

  // ── Pause / Resume ──────────────────────────────────────────────────────────

  const handleTogglePause = useCallback(() => {
    if (playState === "playing") {
      pausedRef.current = true;
      if ("speechSynthesis" in window) window.speechSynthesis.pause();
      pauseTimer();
      setPlayState("paused");
    } else if (playState === "paused") {
      pausedRef.current = false;
      if ("speechSynthesis" in window) {
        // Web Speech resume doesn't always work reliably — re-speak current segment
        window.speechSynthesis.cancel();
        speakSegment(segIndexRef.current);
      }
      startTimer();
      setPlayState("playing");
    }
  }, [playState, pauseTimer, startTimer, speakSegment]);

  // ── Stop ────────────────────────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    stopAll();
    setPlayState("ready");
    setCurrentSeg(0);
    setElapsed(0);
  }, [stopAll]);

  // ── Prev / Next segment ─────────────────────────────────────────────────────

  const goToSegment = useCallback(
    (index: number) => {
      const segs = scriptRef.current?.segments ?? [];
      const clamped = Math.max(0, Math.min(index, segs.length - 1));
      pausedRef.current = false;
      segIndexRef.current = clamped;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speakSegment(clamped);
      if (playState !== "playing") setPlayState("playing");
    },
    [playState, speakSegment]
  );

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    stopAll();
    setPlayState("idle");
    setScript(null);
    scriptRef.current = null;
    setCurrentSeg(0);
    setElapsed(0);
    setStatusMsg("");
    setShowTranscript(false);
  }, [stopAll]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const isActive  = playState === "playing" || playState === "paused";
  const isBusy    = playState === "generating";

  const getStoryDomain = (story: MarketStory) => {
    const map: Record<string, string | undefined> = {
      Reuters: "reuters.com", Bloomberg: "bloomberg.com",
      "World Gold Council": "gold.org", "NVIDIA IR": "nvidia.com",
      MarketWatch: "marketwatch.com", ECB: "ecb.europa.eu",
      "Federal Reserve": "federalreserve.gov", CoinDesk: "coindesk.com",
    };
    const src = story.slides[0]?.source ?? story.label;
    return { name: src, domain: map[src] };
  };

  const totalSegs = script?.segments.length ?? 0;
  const seg       = script?.segments[currentSeg];
  const progress  = totalSegs ? ((currentSeg + 1) / totalSegs) * 100 : 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-5 pb-8 max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/25 rounded-full mx-auto mb-4 shrink-0" />

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <Headphones size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">Financial Radio</h3>
              {hasKey && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,212,168,0.15)",
                    color: "#00D4A8",
                    border: "1px solid rgba(0,212,168,0.3)",
                  }}
                >
                  AI · Groq
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* ── Mode selector (always visible) ── */}
          {(playState === "idle" || isBusy) && (
            <div className="flex bg-secondary rounded-xl p-1 mb-4 shrink-0">
              {(["radio", "podcast"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { if (!isBusy) setMode(m); }}
                  disabled={isBusy}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize disabled:opacity-50"
                  style={{
                    background: mode === m ? "rgba(0,212,168,0.15)" : "transparent",
                    color: mode === m ? "#00D4A8" : "rgba(255,255,255,0.45)",
                    border: mode === m ? "1px solid rgba(0,212,168,0.3)" : "1px solid transparent",
                  }}
                >
                  {m === "radio" ? "🎙️ Radio" : "🎧 Podcast"}
                </button>
              ))}
            </div>
          )}

          {/* ── Scrollable content ── */}
          <div className="overflow-y-auto flex-1 min-h-0 space-y-4">

            {/* ════ IDLE STATE: full configuration ════ */}
            {playState === "idle" && (
              <>
                {/* Mode description */}
                <div
                  className="rounded-xl p-3 text-xs text-muted-foreground leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {mode === "radio"
                    ? "📻 One AI host reads and explains your selected news in a polished radio format. Choose a voice style below."
                    : "🎙️ Three AI personas — Analyst, Investor & Strategist — debate the news in a lively conversation. References your portfolio."}
                </div>

                {/* Topic selection */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-sm font-semibold text-foreground">Topics</p>
                    <button onClick={toggleAll} className="text-xs text-primary font-medium">
                      {selectedStories.size === stories.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {stories.map((story) => {
                      const isSelected = selectedStories.has(story.id);
                      const src = getStoryDomain(story);
                      return (
                        <button
                          key={story.id}
                          onClick={() => toggleStory(story.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            isSelected
                              ? "border border-primary/30"
                              : "bg-secondary border border-transparent"
                          }`}
                          style={isSelected ? { background: "rgba(0,212,168,0.08)" } : {}}
                        >
                          <SourceLogo name={src.name} domain={src.domain} size={34} />
                          <span className="text-sm font-medium text-foreground flex-1 text-left">
                            {story.label}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">
                            {story.slides.length} slides
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-primary" : "border-2 border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <Check size={11} className="text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Length</p>
                  <div className="flex bg-secondary rounded-xl p-1">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                          duration === d.value ? "bg-card text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice selector — Radio only */}
                {mode === "radio" && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Voice Style</p>
                    <div className="flex gap-2">
                      {RADIO_VOICES.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setRadioVoice(v.id)}
                          className="flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
                          style={{
                            background: radioVoice === v.id ? "rgba(0,212,168,0.1)" : "rgba(255,255,255,0.03)",
                            borderColor: radioVoice === v.id ? "rgba(0,212,168,0.4)" : "rgba(255,255,255,0.07)",
                          }}
                        >
                          <span className="text-base">
                            {v.id === "neutral" ? "🎙️" : v.id === "energetic" ? "⚡" : "🧘"}
                          </span>
                          <span
                            className="text-xs font-bold leading-tight text-center"
                            style={{ color: radioVoice === v.id ? "#00D4A8" : "rgba(255,255,255,0.6)" }}
                          >
                            {v.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">
                            {v.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Podcast personas preview — Podcast mode */}
                {mode === "podcast" && (
                  <div
                    className="rounded-xl p-3 space-y-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Podcast cast
                    </p>
                    {PERSONAS.map((p) => (
                      <div key={p.id} className="flex items-start gap-2.5">
                        <span className="text-base shrink-0">{p.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{p.label}</p>
                          <p className="text-[10px] text-muted-foreground">{p.style}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ════ GENERATING STATE ════ */}
            {isBusy && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,212,168,0.1)", border: "2px solid rgba(0,212,168,0.3)" }}
                  >
                    <Wand2 size={28} style={{ color: "#00D4A8" }} />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: "rgba(0,212,168,0.4)" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.7, repeat: Infinity }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">{statusMsg}</p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "podcast"
                      ? "Creating a 3-persona financial conversation…"
                      : "Crafting your personalised radio broadcast…"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ════ READY STATE: script preview + Start Listening ════ */}
            {playState === "ready" && script && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Script info card */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,212,168,0.1) 0%, rgba(0,212,168,0.04) 100%)",
                    border: "1px solid rgba(0,212,168,0.25)",
                  }}
                >
                  <p className="text-sm font-bold text-foreground mb-1">{script.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{script.segments.length} segments</span>
                    <span>·</span>
                    <span>~{Math.round(script.wordCount / 130)} min</span>
                    <span>·</span>
                    <span className="capitalize">{script.mode} mode</span>
                  </div>
                </div>

                {/* First segment preview */}
                {script.segments[0] && (
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <SpeakerBadge speaker={script.segments[0].speaker} emoji={script.segments[0].emoji} />
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                      "{script.segments[0].text}"
                    </p>
                  </div>
                )}

                {/* Transcript (collapsible) */}
                <div>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="flex items-center gap-2 text-xs text-primary font-semibold mb-2"
                  >
                    {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showTranscript ? "Hide" : "Preview"} full transcript
                  </button>
                  {showTranscript && (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {script.segments.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-3"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <SpeakerBadge speaker={s.speaker} emoji={s.emoji} />
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {statusMsg && (
                  <p className="text-xs text-muted-foreground text-center italic">{statusMsg}</p>
                )}
              </motion.div>
            )}

            {/* ════ PLAYING / PAUSED STATE ════ */}
            {isActive && script && seg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Current speaker */}
                <div className="flex justify-center">
                  <SpeakerBadge speaker={seg.speaker} emoji={seg.emoji} />
                </div>

                {/* Waveform */}
                <div className="flex justify-center">
                  <Waveform playing={playState === "playing"} />
                </div>

                {/* Current segment text */}
                <div
                  className="rounded-2xl p-4 mx-1"
                  style={{
                    background: "rgba(0,212,168,0.06)",
                    border: "1px solid rgba(0,212,168,0.18)",
                  }}
                >
                  <p className="text-sm text-foreground leading-relaxed text-center">
                    "{seg.text}"
                  </p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Segment {currentSeg + 1} of {totalSegs}</span>
                    <span>{fmt(elapsed)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "#00D4A8" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Transcript toggle during playback */}
                <div>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium"
                  >
                    {showTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showTranscript ? "Hide" : "Show"} transcript
                  </button>
                  {showTranscript && (
                    <div className="space-y-1.5 mt-2 max-h-44 overflow-y-auto pr-1">
                      {script.segments.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => goToSegment(i)}
                          className="w-full text-left rounded-xl p-2.5 transition-all"
                          style={{
                            background:
                              i === currentSeg
                                ? "rgba(0,212,168,0.12)"
                                : "rgba(255,255,255,0.03)",
                            border: `1px solid ${i === currentSeg ? "rgba(0,212,168,0.35)" : "rgba(255,255,255,0.06)"}`,
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs">{s.emoji}</span>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: i === currentSeg ? "#00D4A8" : "rgba(255,255,255,0.4)" }}
                            >
                              {s.speaker}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {s.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── CTA bar (always at bottom) ── */}
          <div className="shrink-0 pt-4 space-y-2">
            {/* Disclaimer note (tiny) */}
            {(playState === "playing" || playState === "ready") && (
              <p className="text-[10px] text-muted-foreground text-center px-2">
                Educational only · Not financial advice
              </p>
            )}

            {/* IDLE → Generate */}
            {playState === "idle" && (
              <button
                onClick={handleGenerate}
                disabled={selectedStories.size === 0}
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:opacity-75"
                style={{ background: "#00D4A8", color: "#0d1a17" }}
              >
                <Wand2 size={17} />
                {hasKey
                  ? `Generate AI ${mode === "radio" ? "Radio" : "Podcast"}`
                  : "Generate Script"}
              </button>
            )}

            {/* GENERATING */}
            {isBusy && (
              <button
                disabled
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 opacity-55"
                style={{ background: "#00D4A8", color: "#0d1a17" }}
              >
                <Loader2 size={17} className="animate-spin" />
                Writing script…
              </button>
            )}

            {/* READY → Start Listening */}
            {playState === "ready" && (
              <>
                <button
                  onClick={handleStartListening}
                  className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity active:opacity-75"
                  style={{ background: "#00D4A8", color: "#0d1a17" }}
                >
                  <Play size={17} />
                  Start Listening
                </button>
                <button
                  onClick={handleReset}
                  className="w-full text-sm text-muted-foreground font-medium py-1.5 text-center"
                >
                  Start over
                </button>
              </>
            )}

            {/* PLAYING / PAUSED */}
            {isActive && (
              <div className="space-y-2">
                {/* Main controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToSegment(segIndexRef.current - 1)}
                    disabled={currentSeg === 0}
                    className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30"
                  >
                    <SkipBack size={16} className="text-foreground" />
                  </button>

                  <button
                    onClick={handleTogglePause}
                    className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "#00D4A8", color: "#0d1a17" }}
                  >
                    {playState === "playing" ? (
                      <><Pause size={16} /> Pause</>
                    ) : (
                      <><Play size={16} /> Resume</>
                    )}
                  </button>

                  <button
                    onClick={() => goToSegment(segIndexRef.current + 1)}
                    disabled={currentSeg >= totalSegs - 1}
                    className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30"
                  >
                    <SkipForward size={16} className="text-foreground" />
                  </button>

                  <button
                    onClick={handleStop}
                    className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center"
                  >
                    <Square size={15} className="text-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioSummarySheet;
