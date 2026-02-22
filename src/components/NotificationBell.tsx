import { useState } from "react";
import { Bell, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationContext";

const NotificationBell = () => {
  const { notifications, removeNotification, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const count = notifications.length;

  return (
    <>
      {/* Bell + badge */}
      <button
        className="relative"
        onClick={() => setOpen(true)}
        aria-label="Notifications"
      >
        <Bell size={22} className="text-foreground/70" />

        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.25, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, times: [0, 0.5, 1] }}
              className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 flex items-center justify-center"
            >
              <span className="text-[9px] font-bold text-white leading-none">
                {count > 9 ? "9+" : count}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Notification sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/50"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[111] max-w-md mx-auto bg-card rounded-t-2xl border-t border-border px-5 pt-5 pb-10"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Notifications</h3>
                <div className="flex items-center gap-3">
                  {count > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-primary font-medium"
                    >
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}>
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Empty state */}
              {count === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  You're all caught up.
                </p>
              )}

              {/* Notification cards */}
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-secondary rounded-xl p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {n.title}
                      </p>
                      <button onClick={() => removeNotification(n.id)}>
                        <X size={14} className="text-muted-foreground shrink-0" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.body}
                    </p>
                    <button
                      onClick={() => {
                        removeNotification(n.id);
                        setOpen(false);
                      }}
                      className="mt-1 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg w-fit"
                    >
                      <Play size={11} />
                      {n.cta}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationBell;
