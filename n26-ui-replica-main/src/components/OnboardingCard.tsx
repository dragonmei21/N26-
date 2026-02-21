const OnboardingCard = () => {
  return (
    <div className="mx-4 bg-card rounded-xl border border-border p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Get ready to bank your way</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        <div className="min-w-[180px] bg-secondary rounded-xl p-4 flex flex-col items-center text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-sm font-semibold text-foreground">Add money</p>
          <p className="text-xs text-muted-foreground mt-1">Start banking in seconds with an instant transfer</p>
        </div>
        <div className="min-w-[180px] bg-secondary rounded-xl p-4 flex flex-col items-center text-center">
          <div className="text-4xl mb-3">📱</div>
          <p className="text-sm font-semibold text-foreground">Add card to wallet</p>
          <p className="text-xs text-muted-foreground mt-1">Pay with your phone, securely and seamlessly</p>
        </div>
        <div className="min-w-[180px] bg-secondary rounded-xl p-4 flex flex-col items-center text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-sm font-semibold text-foreground">Set up notifications</p>
          <p className="text-xs text-muted-foreground mt-1">Stay on top of your spending and savings</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full h-1 bg-secondary rounded-full">
          <div className="w-0 h-1 bg-muted-foreground rounded-full" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">0/5 completed</p>
      </div>
    </div>
  );
};

export default OnboardingCard;
