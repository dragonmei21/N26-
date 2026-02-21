import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { CreditCard, Lock, Settings, Snowflake, Eye } from "lucide-react";

const Cards = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      <PageHeader title="Cards" />

      <div className="px-4 mb-6">
        {/* Virtual card */}
        <div className="bg-gradient-to-br from-secondary to-card rounded-2xl p-6 border border-border relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-20">
            <CreditCard size={80} className="text-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">N26 Standard</p>
          <p className="text-lg font-bold text-foreground mb-8">Virtual Card</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground tracking-widest">•••• •••• •••• 4521</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">Valid thru 02/29</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full bg-negative/60" />
              <div className="w-6 h-6 rounded-full bg-warning/60 -ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Card actions */}
      <div className="flex items-center justify-around px-8 mb-6">
        {[
          { icon: Snowflake, label: "Freeze" },
          { icon: Eye, label: "Details" },
          { icon: Lock, label: "PIN" },
          { icon: Settings, label: "Settings" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Icon size={20} className="text-foreground" />
              </div>
              <span className="text-xs text-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Card settings */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Card settings</h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[
            { label: "Online payments", desc: "Enabled" },
            { label: "ATM withdrawals", desc: "Enabled" },
            { label: "Contactless payments", desc: "Enabled" },
            { label: "Spending limits", desc: "5.000 € / day" },
          ].map((setting, i) => (
            <div key={setting.label} className={`p-4 flex items-center justify-between ${i < 3 ? "border-b border-border" : ""}`}>
              <div>
                <p className="text-sm font-medium text-foreground">{setting.label}</p>
                <p className="text-xs text-muted-foreground">{setting.desc}</p>
              </div>
              <div className="w-10 h-6 rounded-full bg-primary flex items-center justify-end px-0.5">
                <div className="w-5 h-5 rounded-full bg-primary-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order physical card */}
      <div className="px-4 mt-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-base font-semibold text-foreground mb-1">Order a physical card</h3>
          <p className="text-sm text-muted-foreground mb-3">Get a free physical card delivered to your door.</p>
          <button className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold w-full">
            Order card
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Cards;
