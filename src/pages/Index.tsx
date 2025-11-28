import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MessageCircle, Scan } from "lucide-react";
import heroImage from "@/assets/hero-wardrobe.jpg";
import MobileNav from "@/components/MobileNav";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-light tracking-tight">StyleCapsule</h1>
          <div className="flex gap-2 items-center">
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="font-light text-xs">
                Logout
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="font-light text-xs">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Curated wardrobe" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        </div>
        
        <div className="relative z-10 max-w-lg mx-auto px-4 py-12 text-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-light">AI-Powered Style</p>
            <h1 className="text-5xl font-light leading-tight tracking-tighter">
              Your Perfect<br />
              <span className="font-normal italic">Wardrobe,</span><br />
              <span className="gradient-text font-normal">Curated by AI</span>
            </h1>
            <p className="text-base text-muted-foreground font-light leading-relaxed max-w-md mx-auto">
              Discover a capsule wardrobe tailored to your unique style through our AI platform
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button variant="luxury" size="lg" onClick={() => navigate("/survey")} className="w-full">
                Get Started <ArrowRight className="ml-2" />
              </Button>
              {!user && (
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="w-full font-light">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <h2 className="text-2xl font-light text-center mb-8">Powered by AI Technology</h2>
        <div className="grid gap-4">
          <div className="p-6 rounded-lg border border-border bg-card cursor-pointer hover:border-primary transition-all" onClick={() => navigate("/ai-stylist")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-light text-lg mb-1">AI Stylist Chat</h3>
                <p className="text-sm text-muted-foreground font-light">Get personalized fashion advice anytime</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card cursor-pointer hover:border-primary transition-all" onClick={() => navigate("/virtual-tryon")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Scan className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-light text-lg mb-1">Virtual Try-On</h3>
                <p className="text-sm text-muted-foreground font-light">See how clothes look before you buy</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card cursor-pointer hover:border-primary transition-all" onClick={() => navigate(user ? "/outfit-planner" : "/auth")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-light text-lg mb-1">Outfit Planner</h3>
                <p className="text-sm text-muted-foreground font-light">Plan your weekly outfits effortlessly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="space-y-6 p-8 rounded-lg bg-gradient-to-b from-primary/5 to-accent/5">
          <h2 className="text-3xl font-light">Ready to Transform<br /><span className="italic font-normal">Your Wardrobe?</span></h2>
          <p className="text-sm text-muted-foreground font-light">Start your style journey today</p>
          <Button variant="luxury" size="lg" onClick={() => navigate("/survey")} className="w-full">
            Begin Your Journey <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      <MobileNav />
    </div>
  );
};

export default Index;
