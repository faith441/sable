import { useNavigate, useLocation } from "react-router-dom";
import { Home, Sparkles, ShoppingBag, Calendar, MessageCircle } from "lucide-react";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/wardrobe", icon: Home, label: "Home" },
    { path: "/ai-stylist", icon: MessageCircle, label: "Stylist" },
    { path: "/wardrobe", icon: Sparkles, label: "Wardrobe" },
    { path: "/cart", icon: ShoppingBag, label: "Cart" },
    { path: "/outfit-planner", icon: Calendar, label: "Planner" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
              isActive(path) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-xs font-light">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;