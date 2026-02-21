import { motion } from "framer-motion";
import { Eye, ArrowUpDown, HelpCircle, Plus, Link2, ChevronRight, Wallet } from "lucide-react";
import { addMoreItems } from "@/data/mockData";

const Finances = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-3xl font-bold text-foreground">Finances</h1>
        <div className="flex items-center gap-3">
          <Eye size={22} className="text-foreground/70" />
          <ArrowUpDown size={22} className="text-foreground/70" />
          <div className="w-px h-5 bg-border mx-1" />
          <div className="relative">
            <HelpCircle size={22} className="text-foreground/70" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">PG</span>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="px-4 mb-4">
        <p className="text-sm text-muted-foreground">Your Balance</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">2/2 shown</span>
          <Pen size={12} className="text-muted-foreground" />
        </div>
        <p className="text-4xl font-bold text-foreground mt-1">0,00 €</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around px-16 mb-6">
        <button className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Plus size={24} className="text-primary-foreground" />
          </div>
          <span className="text-xs text-foreground">New Space</span>
        </button>
        <button className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Link2 size={24} className="text-foreground" />
          </div>
          <span className="text-xs text-foreground">Automations</span>
        </button>
      </div>

      {/* Spaces */}
      <div className="px-4 mb-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Spaces</h3>
        <div className="bg-primary/20 rounded-xl p-4 flex items-center gap-3 border border-primary/30">
          <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center">
            <Wallet size={20} className="text-primary" />
          </div>
          <span className="text-base font-medium text-foreground flex-1">Main Account</span>
          <span className="text-base font-semibold text-foreground">0,00 €</span>
        </div>
      </div>

      {/* Investments */}
      <div className="px-4 mb-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Investments</h3>
        <div className="bg-card rounded-xl p-4 flex items-center gap-3 border border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-lg">📈</span>
          </div>
          <div className="flex-1">
            <span className="text-base font-medium text-foreground">Stocks and ETFs</span>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-foreground">0,00 €</p>
            <p className="text-xs text-muted-foreground">0%</p>
          </div>
        </div>
      </div>

      {/* Build healthy habits */}
      <div className="px-4 mb-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Build healthy habits</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <div className="min-w-[220px] bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">Invest regularly</p>
            <p className="text-xs text-muted-foreground mt-1">Set up a savings plan to build a healthy habit.</p>
            <button className="mt-3 bg-secondary rounded-lg px-4 py-2 text-sm text-foreground">Make a plan</button>
          </div>
          <div className="min-w-[220px] bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-negative/20 flex items-center justify-center">
                <span className="text-sm">🔄</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">Move money automatically</p>
            <p className="text-xs text-muted-foreground mt-1">Use Rules to automatically move money between accounts.</p>
            <button className="mt-3 bg-secondary rounded-lg px-4 py-2 text-sm text-foreground">Create a Rule</button>
          </div>
        </div>
      </div>

      {/* Add more */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Add more</h3>
        <div className="space-y-3">
          {addMoreItems.map((item) => (
            <div key={item.title} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
              <div className="flex-1">
                <p className="text-base font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <span className="text-3xl">{item.emoji}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Pen = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export default Finances;
