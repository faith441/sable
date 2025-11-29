import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Shirt, Sparkles, ShoppingBag, Calendar, MessageCircle, Heart } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) return null;

  const features = [
    {
      title: "My Closet",
      description: "Browse your wardrobe items",
      icon: Shirt,
      path: "/closet",
      color: "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20"
    },
    {
      title: "Outfit Planner",
      description: "Plan your weekly outfits",
      icon: Calendar,
      path: "/outfit-planner",
      color: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20"
    },
    {
      title: "AI Wardrobe",
      description: "Get personalized recommendations",
      icon: Sparkles,
      path: "/wardrobe",
      color: "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
    },
    {
      title: "AI Stylist",
      description: "Chat with your personal stylist",
      icon: MessageCircle,
      path: "/ai-stylist",
      color: "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
    },
    {
      title: "Shopping Cart",
      description: "Review items to purchase",
      icon: ShoppingBag,
      path: "/cart",
      color: "bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20"
    },
    {
      title: "Favorites",
      description: "View your saved items",
      icon: Heart,
      path: "/favorites",
      color: "bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 border-pink-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            onClick={() => navigate("/home")}
            className="text-2xl font-light tracking-tight cursor-pointer hover:text-primary transition-colors"
          >
            StyleCapsule
          </h1>
          <ProfileMenu onProfileClick={() => setIsProfileOpen(true)} />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-light">Welcome Back</h2>
            <p className="text-muted-foreground font-light">Your personal style dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.path}
                  onClick={() => navigate(feature.path)}
                  className={`p-6 cursor-pointer hover-scale border-2 ${feature.color} transition-all`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background/50">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-normal">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-light">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <MobileNav />
      <ProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
};

export default Home;
