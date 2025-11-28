import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Palette } from "lucide-react";
import heroImage from "@/assets/hero-wardrobe.jpg";

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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">StyleCapsule</h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/wardrobe")}>
                  My Wardrobe
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/survey")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage}
            alt="Curated wardrobe"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              Your Perfect Wardrobe,{" "}
              <span className="text-primary">Curated by AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Take our style quiz and discover a capsule wardrobe tailored to your unique preferences, lifestyle, and budget.
            </p>
            <div className="flex gap-4">
              <Button 
                size="lg"
                onClick={() => navigate(user ? "/survey" : "/auth")}
                className="text-lg px-8"
              >
                Discover Your Style <ArrowRight className="ml-2" />
              </Button>
              {!user && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="text-lg px-8"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Take the Survey</h3>
              <p className="text-muted-foreground">
                Answer questions about your style preferences, lifestyle, and budget to help us understand you.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">AI Curation</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your responses and curates a personalized capsule wardrobe just for you.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Shop & Style</h3>
              <p className="text-muted-foreground">
                Browse your curated pieces and shop directly from our partnered brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Transform Your Wardrobe?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of fashion-forward individuals who have discovered their perfect style.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate(user ? "/survey" : "/auth")}
            className="text-lg px-8"
          >
            Start Your Style Journey <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 StyleCapsule. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;