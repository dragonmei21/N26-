import { Eye, Search, Bell } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showSearch?: boolean;
  showSort?: boolean;
  showSettings?: boolean;
}

const PageHeader = ({ title, showSearch = true }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 pt-12 pb-4">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <Eye size={22} className="text-foreground/70" />
        {showSearch && <Search size={22} className="text-foreground/70" />}
        <div className="w-px h-5 bg-border mx-1" />
        <div className="relative">
          <Bell size={22} className="text-foreground/70" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-negative rounded-full" />
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-xs font-semibold text-foreground">PG</span>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
