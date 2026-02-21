import { Plus, ArrowRight, Percent, MoreHorizontal } from "lucide-react";

const actions = [
  { label: "Deposit", icon: Plus },
  { label: "Transfer", icon: ArrowRight },
  { label: "Bizum", icon: Percent },
  { label: "More", icon: MoreHorizontal },
];

const QuickActions = () => {
  return (
    <div className="flex items-center justify-around px-8 py-5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button key={action.label} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <Icon size={24} className="text-primary-foreground" />
            </div>
            <span className="text-xs text-foreground">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
