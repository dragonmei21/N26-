import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Headphones, Play, Pause, Square, Loader2 } from "lucide-react";
import type { MarketStory } from "@/data/marketStories";
import SourceLogo from "@/components/SourceLogo";

interface AudioSummarySheetProps {
  stories: MarketStory[];
  onClose: () => void;
}

const durations = [
  { label: "1 min", value: "1", sentencesPerTopic: 1 },
  { label: "5 min", value: "5", sentencesPerTopic: 2 },
  { label: "10 min", value: "10", sentencesPerTopic: 3 },
  { label: "Auto", value: "auto", sentencesPerTopic: 2 },
];

type PlayState = "idle" | "generating" | "ready" | "playing" | "paused";

function generateScript(stories: MarketStory[], selectedIds: Set<string>, durationValue: string): string {
  const dur = durations.find((d) => d.value === durationValue) ?? durations[3];
  const selected = stories.filter((s) => selectedIds.has(s.id));
  const lines: string[] = ["Here's your market audio briefing."];

  for (const story of selected) {
    lines.push(`Next up: ${story.label}.`);
    const slides = story.slides.slice(0, dur.sentencesPerTopic);
    for (const slide of slides) {
      lines.push(`${slide.headline}. ${slide.body}`);
    }
  }
  lines.push("That's your briefing. Stay informed!");
  return lines.join(" ");
}

function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const AudioSummarySheet = ({ stories, onClose }: AudioSummarySheetProps) => {
  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set(stories.map((s) => s.id))
  );
  const [duration, setDuration] = useState("auto");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const speechAvailable = useRef(isSpeechAvailable());
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

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
    if (speechAvailable.current) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    utteranceRef.current = null;
    setPlayState("ready");
    setElapsed(0);
  }, []);

  const backToSelect = useCallback(() => {
    stopPlayback();
    setPlayState("idle");
    setTranscript("");
  }, [stopPlayback]);

  const handleGenerate = useCallback(() => {
    if (selectedStories.size === 0) return;
    setPlayState("generating");
    const script = generateScript(stories, selectedStories, duration);
    // Simulate brief generation delay
    setTimeout(() => {
      setTranscript(script);
      setPlayState("ready");
    }, 1500);
  }, [stories, selectedStories, duration]);

  const startPlayback = useCallback(() => {
    if (!transcript) return;

    if (!speechAvailable.current) {
      setPlayState("playing");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.rate = 1;
    utterance.pitch = 1;
    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setPlayState("playing");
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    };

    utterance.onend = () => {
      stopPlayback();
    };

    utterance.onerror = () => {
      stopPlayback();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [transcript, stopPlayback]);

  const togglePause = useCallback(() => {
    if (!speechAvailable.current) return;
    if (playState === "playing") {
      window.speechSynthesis.pause();
      setPlayState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (playState === "paused") {
      window.speechSynthesis.resume();
      setPlayState("playing");
      startTimeRef.current = Date.now() - elapsed * 1000;
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    }
  }, [playState, elapsed]);

  useEffect(() => {
    return () => {
      if (speechAvailable.current) window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const statusLine = (() => {
    switch (playState) {
      case "idle":
        return "Choose topics to generate a short audio briefing.";
      case "generating":
        return "Generating your audio…";
      case "ready":
        return "Your summary is ready to play.";
      case "playing":
        return `Now playing: ${formatTime(elapsed)}`;
      case "paused":
        return `Paused at ${formatTime(elapsed)}`;
    }
  })();

  const isPlayingOrPaused = playState === "playing" || playState === "paused";
  const isReadyOrPlaying = playState === "ready" || isPlayingOrPaused;

  // Get the first source domain from story slides for logo display
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-2xl border-t border-border p-5 pb-8 max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
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

          <div className="overflow-y-auto flex-1 min-h-0">
            {playState === "idle" || playState === "generating" ? (
              <>
                {/* Story selection */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
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
                            {story.slides.length} {story.slides.length === 1 ? "story" : "stories"}
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

                {/* Duration selection */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-3">Summary length</p>
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
              </>
            ) : isReadyOrPlaying ? (
              /* Playing state */
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Headphones size={28} className="text-primary" />
                </div>

                {/* Waveform */}
                <div className="flex items-center gap-0.5 h-8 mb-4">
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

                {!speechAvailable.current && (
                  <div className="bg-secondary rounded-xl p-4 mb-4 w-full">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Audio not supported on this device — transcript:
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
                  </div>
                )}

                {/* Playback controls */}
                {speechAvailable.current && (
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={togglePause}
                      className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
                    >
                      {playState === "playing" ? (
                        <Pause size={20} className="text-primary-foreground" />
                      ) : (
                        <Play size={20} className="text-primary-foreground ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={stopPlayback}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                    >
                      <Square size={16} className="text-foreground" />
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Status + CTA */}
          <div className="shrink-0 pt-3">
            <p className="text-xs text-muted-foreground text-center mb-3">{statusLine}</p>
            {playState === "idle" && (
              <button
                onClick={handleGenerate}
                disabled={selectedStories.size === 0}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Headphones size={16} />
                Generate summary
              </button>
            )}
            {playState === "generating" && (
              <button
                disabled
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-70"
              >
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </button>
            )}
            {playState === "ready" && (
              <div className="space-y-2">
                <button
                  onClick={startPlayback}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Play summary
                </button>
                <button
                  onClick={backToSelect}
                  className="w-full text-sm text-muted-foreground font-medium"
                >
                  Generate another
                </button>
              </div>
            )}
            {isPlayingOrPaused && (
              <button
                onClick={backToSelect}
                className="w-full bg-secondary text-foreground py-3.5 rounded-xl text-sm font-semibold"
              >
                Stop and go back
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioSummarySheet;
