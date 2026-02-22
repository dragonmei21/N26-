import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { MarketStory } from "@/data/marketStories";
import SourceLogo from "@/components/SourceLogo";

interface StoriesViewerProps {
  stories: MarketStory[];
  initialStoryIndex: number;
  onClose: () => void;
}

const SLIDE_DURATION = 5000;

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
  "Shibarium Explorer": "shibarium.io",
};

const StoriesViewer = ({ stories, initialStoryIndex, onClose }: StoriesViewerProps) => {
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());

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

  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [storyIndex, slideIndex]);

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
    const x = clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else {
      goNext();
    }
  };

  const sourceDomain = sourceDomainMap[slide.source];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
        onClick={handleTap}
      >
        {/* Progress bars */}
        <div className="flex gap-1 px-3 pt-3 pb-2 z-10">
          {story.slides.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: `${i < slideIndex ? 100 : i === slideIndex ? progress * 100 : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{story.label.slice(0, 2).toUpperCase()}</span>
          </div>
          <span className="text-white text-sm font-semibold flex-1">{story.label}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 flex flex-col justify-center items-center px-8 bg-gradient-to-b ${slide.bgGradient}`}>
          <div className="w-12 h-1 rounded-full bg-white/30 mb-6" />
          <h2 className="text-2xl font-bold text-white text-center mb-4 leading-tight">
            {slide.headline}
          </h2>
          <p className="text-white/80 text-center text-sm leading-relaxed max-w-xs">
            {slide.body}
          </p>
          {/* Source with logo */}
          <div className="flex items-center gap-2 mt-6">
            <SourceLogo name={slide.source} domain={sourceDomain} size={20} />
            <span className="text-white/50 text-xs">{slide.source}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoriesViewer;
