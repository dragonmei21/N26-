import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Gift, Shield, Headphones, Plane, ShoppingBag, Heart } from "lucide-react";

const benefits = [
  { icon: Shield, title: "Insurance", desc: "Travel, phone, and purchase protection" },
  { icon: Plane, title: "Travel", desc: "Free ATM withdrawals worldwide" },
  { icon: Headphones, title: "Support", desc: "Dedicated customer support" },
  { icon: ShoppingBag, title: "Discounts", desc: "Exclusive partner offers and discounts" },
  { icon: Heart, title: "Lifestyle", desc: "Curated experiences and perks" },
  { icon: Gift, title: "Rewards", desc: "Cashback on selected purchases" },
];

const Benefits = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      <PageHeader title="Benefits" />

      <div className="px-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-bold text-foreground mb-1">Upgrade your plan</h3>
          <p className="text-sm text-muted-foreground">Unlock premium benefits with N26 Smart, You, or Metal.</p>
          <button className="mt-4 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold">
            Compare plans
          </button>
        </div>
      </div>

      <div className="px-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Available benefits</h3>
        <div className="space-y-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default Benefits;
