import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import { useNotifications, type AppNotification } from "@/context/NotificationContext";

const NotificationBanner = () => {
  const { notifications, removeNotification } = useNotifications();
  const [visible, setVisible] = useState<AppNotification | null>(null);

  // Show the latest notification as a banner
  useEffect(() => {
    if (notifications.length > 0) {
      setVisible(notifications[notifications.length - 1]);
    } else {
      setVisible(null);
    }
  }, [notifications]);

  const dismiss = (id: string) => {
    setVisible(null);
    removeNotification(id);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={visible.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed top-4 left-0 right-0 z-[200] max-w-md mx-auto px-4"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <span className="text-base">🔔</span>
                </div>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {visible.title}
                </p>
              </div>
              <button onClick={() => dismiss(visible.id)}>
                <X size={16} className="text-muted-foreground shrink-0" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-10">
              {visible.body}
            </p>

            <div className="pl-10">
              <button
                onClick={() => dismiss(visible.id)}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg"
              >
                <Play size={11} />
                {visible.cta}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationBanner;
