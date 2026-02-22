import { useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, PieChart, Gift, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/finances", label: "Finances", icon: BarChart3 },
  { path: "/investments", label: "Investments", icon: PieChart },
  { path: "/benefits", label: "Benefits", icon: Gift },
  { path: "/cards", label: "Cards", icon: CreditCard },
];

const HIDDEN_PATHS = ["/scenarios"];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-6">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
            >
              <Icon
                size={22}
                className={isActive ? "text-primary" : "text-muted-foreground"}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
      {/* Home indicator bar */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-foreground/30 rounded-full" />
      </div>
    </nav>
  );
};

export default BottomNav;
