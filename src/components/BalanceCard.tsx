import { ChevronRight, CreditCard } from "lucide-react";

const BalanceCard = () => {
  return (
    <div className="mx-4 bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-foreground">Main Account</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-1">0,00 €</p>
          <button className="text-primary text-sm mt-1">Explore overdraft</button>
        </div>
        <button className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
          <CreditCard size={16} className="text-foreground" />
          <span className="text-sm font-medium text-foreground">Cards</span>
        </button>
      </div>
    </div>
  );
};

export default BalanceCard;
