import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Headphones, Play, Pause, Square, Loader2 } from "lucide-react";
import type { MarketStory } from "@/data/marketStories";
import SourceLogo from "@/components/SourceLogo";
import { generatePodcast, BASE_URL, HEADERS, type PodcastLength } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AudioSummarySheetProps {
  stories: MarketStory[];
  onClose: () => void;
}

const durations: { label: string; value: string; length: PodcastLength }[] = [
  { label: "1 min",  value: "1",    length: "flash"     },
  { label: "5 min",  value: "5",    length: "brief"     },
  { label: "10 min", value: "10",   length: "deep_dive" },
  { label: "Auto",   value: "auto", length: "flash"     },
];

type PlayState = "idle" | "generating" | "ready" | "playing" | "paused";

const AudioSummarySheet = ({ stories, onClose }: AudioSummarySheetProps) => {
  const { toast } = useToast();

  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set(stories.map((s) => s.id))
  );
  const [duration, setDuration] = useState("auto");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [podcastTitle, setPodcastTitle] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

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
    clearTimer();
    setPlayState("ready");
    setElapsed(0);
  }, []);

  const backToSelect = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    clearTimer();
    setPlayState("idle");
    setElapsed(0);
    setTotalDuration(0);
    setPodcastTitle("");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedStories.size === 0) return;
    setPlayState("generating");

    const dur = durations.find((d) => d.value === duration) ?? durations[3];

    try {
      const meta = await generatePodcast(dur.length, "personal");

      // Build full audio src with ngrok bypass header workaround:
      // <audio> can't set custom headers, so we fetch the blob manually
      const audioSrc = `${BASE_URL}${meta.audio_url}`;
      const audioRes = await fetch(audioSrc, { headers: HEADERS });
      if (!audioRes.ok) throw new Error("Audio stream unavailable");
      const blob = await audioRes.blob();
      const objectUrl = URL.createObjectURL(blob);

      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setTotalDuration(Math.floor(audio.duration));
      };

      audio.ontimeupdate = () => {
        setElapsed(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        clearTimer();
        setPlayState("ready");
        setElapsed(0);
      };

      audio.onerror = () => {
        clearTimer();
        setPlayState("ready");
        toast({ title: "Playback error", description: "Could not play audio.", variant: "destructive" });
      };

      setPodcastTitle(meta.title);
      setPlayState("ready");
    } catch (err) {
      setPlayState("idle");
      toast({
        title: "Could not generate podcast",
        description: "Make sure the backend is running and /feed was called first.",
        variant: "destructive",
      });
    }
  }, [selectedStories, duration, toast]);

  const startPlayback = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setPlayState("playing");
  }, []);

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    if (playState === "playing") {
      audioRef.current.pause();
      setPlayState("paused");
    } else if (playState === "paused") {
      audioRef.current.play();
      setPlayState("playing");
    }
  }, [playState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      clearTimer();
    };
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const statusLine = (() => {
    switch (playState) {
      case "idle":       return "Choose topics to generate a short audio briefing.";
      case "generating": return "Generating your audio with AI voice…";
      case "ready":      return podcastTitle ? `Ready: ${podcastTitle}` : "Your summary is ready to play.";
      case "playing":    return `Now playing: ${formatTime(elapsed)}${totalDuration ? ` / ${formatTime(totalDuration)}` : ""}`;
      case "paused":     return `Paused at ${formatTime(elapsed)}`;
    }
  })();

  const isPlayingOrPaused = playState === "playing" || playState === "paused";
  const isReadyOrPlaying  = playState === "ready"   || isPlayingOrPaused;

  const getStorySource = (story: MarketStory) => {
    const slide = story.slides[0];
    if (!slide) return { name: story.label, domain: undefined };
    const sourceDomainMap: Record<string, string> = {
      Reuters:            "reuters.com",
      Bloomberg:          "bloomberg.com",
      "World Gold Council":"gold.org",
      "NVIDIA IR":        "nvidia.com",
      MarketWatch:        "marketwatch.com",
      Eurostat:           "ec.europa.eu",
      BLS:                "bls.gov",
      ECB:                "ecb.europa.eu",
      "Federal Reserve":  "federalreserve.gov",
      CoinDesk:           "coindesk.com",
      Etherscan:          "etherscan.io",
      CNBC:               "cnbc.com",
      "Goldman Sachs":    "goldmansachs.com",
    };
    return { name: slide.source, domain: sourceDomainMap[slide.source] };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[101] max-w-md mx-auto bg-card rounded-t-2xl border-t border-border overflow-hidden"
          style={{ maxHeight: '85vh', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle + Header */}
          <div className="px-5 pt-5 shrink-0">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Headphones size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-foreground">Audio summary</h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-5">
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
                            {story.slides.length}{" "}
                            {story.slides.length === 1 ? "story" : "stories"}
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
                      style={{ height: `${Math.max(4, Math.sin(i * 0.5) * 20 + 8)}px` }}
                    />
                  ))}
                </div>

                {/* Progress bar */}
                {totalDuration > 0 && (
                  <div className="w-full bg-secondary rounded-full h-1 mb-4">
                    <div
                      className="bg-primary h-1 rounded-full transition-all"
                      style={{ width: `${(elapsed / totalDuration) * 100}%` }}
                    />
                  </div>
                )}

                {/* Playback controls */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={isPlayingOrPaused ? togglePause : startPlayback}
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
              </div>
            ) : null}
          </div>

          {/* Status + CTA */}
          <div className="shrink-0 px-5 pt-3 pb-8">
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
