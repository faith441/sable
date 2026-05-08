import { useNavigate, useLocation } from "react-router-dom";
import { Shirt, Sparkles, ShoppingBag, Calendar, MessageCircle, Store } from "lucide-react";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/closet", icon: Shirt, label: "Closet", onClick: () => navigate("/closet") },
    { path: "/outfit-planner", icon: Calendar, label: "Planner", onClick: () => navigate("/outfit-planner") },
    { path: "/wardrobe", icon: Sparkles, label: "Wardrobe", onClick: () => navigate("/wardrobe") },
    { path: "/shop", icon: Store, label: "Shop", onClick: () => navigate("/shop") },
    { path: "/ai-stylist", icon: MessageCircle, label: "Stylist", onClick: () => navigate("/ai-stylist") },
    { path: "/cart", icon: ShoppingBag, label: "Cart", onClick: () => navigate("/cart") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 px-2">
        {navItems.map(({ path, icon: Icon, label, onClick }) => (
          <button
            key={path}
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 active:scale-90 ${
              isActive(path) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive(path) ? "scale-110" : ""}`} strokeWidth={isActive(path) ? 2 : 1.5} />
            <span className={`text-[10px] ${isActive(path) ? "font-medium" : "font-light"}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;