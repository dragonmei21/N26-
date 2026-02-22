import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import type { MarketStory, StoryCategory } from "@/data/marketStories";
import SourceLogo from "@/components/SourceLogo";
import { useUI } from "@/context/UIContext";

interface StoriesViewerProps {
  stories: MarketStory[];
  initialStoryIndex: number;
  onClose: () => void;
}

const SLIDE_DURATION = 6000;

// Pill colours per category
const CATEGORY_STYLES: Record<StoryCategory, string> = {
  Commodities: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Equities:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Macro:       "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Rates:       "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  Crypto:      "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Energy:      "bg-stone-400/20 text-stone-300 border-stone-400/30",
  Technology:  "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

const StoriesViewer = ({ stories, initialStoryIndex, onClose }: StoriesViewerProps) => {
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress]     = useState(0);
  const timerRef    = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const { setStoriesOpen } = useUI();

  // Hide bottom nav while stories are visible
  useEffect(() => {
    setStoriesOpen(true);
    return () => setStoriesOpen(false);
  }, [setStoriesOpen]);

  const story = stories[storyIndex];
  const slide = story.slides[slideIndex];

  const goNext = useCallback(() => {
    if (slideIndex < story.slides.length - 1) {
      setSlideIndex((s) => s + 1);
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex((s) => s + 1);
      setSlideIndex(0);
    } else {
      onClose();
    }
  }, [slideIndex, storyIndex, story.slides.length, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (slideIndex > 0) {
      setSlideIndex((s) => s - 1);
    } else if (storyIndex > 0) {
      setStoryIndex((s) => s - 1);
      setSlideIndex(stories[storyIndex - 1].slides.length - 1);
    }
  }, [slideIndex, storyIndex, stories]);

  // Reset progress on slide change
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [storyIndex, slideIndex]);

  // rAF-based progress ticker
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / SLIDE_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        goNext();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [storyIndex, slideIndex, goNext]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    if (clientX - rect.left < rect.width / 3) goPrev();
    else goNext();
  };

  const categoryStyle = CATEGORY_STYLES[slide.category] ?? "bg-white/10 text-white/60 border-white/20";

  return (
    <AnimatePresence>
      <motion.div
        key="stories-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-y-0 left-0 right-0 z-[60] flex flex-col max-w-md mx-auto"
        onClick={handleTap}
      >
        {/* Full-bleed gradient background — changes per slide */}
        <div className={`absolute inset-0 bg-gradient-to-b ${slide.bgClass} transition-colors duration-500`} />

        {/* News image background at ~60% transparency */}
        {slide.imageUrl && (
          <img
            src={slide.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
          />
        )}

        {/* Dark scrim to ensure text legibility over the image */}
        {slide.imageUrl && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        )}

        {/* Subtle noise/grain overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* ── Progress bars ── */}
        <div className="relative z-30 flex gap-1 px-3 pt-12 pb-2 pointer-events-none">
          {story.slides.map((s, i) => (
            <div key={s.id} className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: `${i < slideIndex ? 100 : i === slideIndex ? progress * 100 : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div
          className="relative z-30 flex items-center justify-between px-4 py-3"
        >
          {/* Story label + category pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white leading-none">{story.label.slice(0, 2).toUpperCase()}</span>
            </div>
            <span className="text-white text-sm font-semibold">{story.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryStyle}`}>
              {slide.category}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-white/60 hover:text-white transition-colors p-2 -mr-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Main content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex-1 flex flex-col justify-center px-5 py-6"
          >
            {/* Headline */}
            <h2 className="text-[22px] font-bold text-white leading-snug mb-3">
              {slide.headline}
            </h2>

            {/* Body */}
            <p className="text-white/75 text-sm leading-relaxed mb-4">
              {slide.body}
            </p>

            {/* Context / "why it matters" callout */}
            <div className="border-l-2 border-white/30 pl-3 mb-5">
              <p className="text-white/50 text-xs leading-relaxed italic">
                {slide.context}
              </p>
            </div>

            {/* ── Source bar ── */}
            <a
              href={slide.sourceUrl ?? `https://${slide.sourceDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 active:bg-white/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5">
                <SourceLogo
                  name={slide.source}
                  domain={slide.sourceDomain}
                  size={22}
                />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium leading-none mb-0.5">
                    Source
                  </p>
                  <p className="text-xs text-white/80 font-semibold leading-none">
                    {slide.source}
                  </p>
                </div>
              </div>
              <ExternalLink size={13} className="text-white/50" />
            </a>
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
};

export default StoriesViewer;
