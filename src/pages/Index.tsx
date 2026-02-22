import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import OnboardingCard from "@/components/OnboardingCard";
import InvestmentsWidget from "@/components/InvestmentsWidget";
import { Pen } from "lucide-react";

const accountIconLabels = ["Card", "Home", "Savings", "Premium", "Stats", "Schedule", "Goals"];

const AccountIcons = () => (
  <div className="flex gap-3 px-4 py-2 overflow-x-auto scrollbar-hide">
    {accountIconLabels.map((label, i) => (
      <div
        key={i}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${i === 0 ? "bg-primary/20 border-2 border-primary" : "bg-secondary"
          }`}
      >
        <span className={`text-[10px] font-semibold text-center leading-tight ${i === 0 ? "text-primary" : "text-muted-foreground"
          }`}>{label}</span>
      </div>
    ))}
  </div>
);

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      <PageHeader title="Home" />
      <AccountIcons />
      <div className="mt-2" />
      <BalanceCard />
      <QuickActions />
      <OnboardingCard />
      <div className="mt-4" />
      <InvestmentsWidget />
      <div className="flex justify-center mt-6 mb-4">
        <button className="flex items-center gap-2 border border-border rounded-full px-5 py-2.5">
          <span className="text-sm text-foreground">Customize</span>
          <Pen size={14} className="text-foreground" />
        </button>
      </div>
    </motion.div>
  );
};

export default Home;
