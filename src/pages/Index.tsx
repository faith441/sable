import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Palette, Check } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
          <h1 className="text-3xl font-light tracking-tight">StyleCapsule</h1>
          <div className="flex gap-6 items-center">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/wardrobe")} className="font-light">
                  My Wardrobe
                </Button>
                <Button variant="outline" onClick={handleLogout} className="font-light">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="font-light">
                  Sign In
                </Button>
                <Button variant="luxury" onClick={() => navigate("/survey")} size="lg">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage}
            alt="Curated wardrobe"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(90deg, hsl(var(--background)) 0%, hsl(var(--background) / 0.98) 30%, hsl(var(--background) / 0.85) 50%, transparent 80%)'
          }} />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 lg:px-12 max-w-7xl py-24">
          <div className="max-w-3xl space-y-10">
            <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
              <p className="text-sm uppercase tracking-wider text-muted-foreground font-light">
                Artificial Intelligence Meets Personal Style
              </p>
              <h1 className="text-7xl lg:text-8xl font-light leading-[0.95] tracking-tighter">
                Your Perfect<br />
                <span className="font-normal italic">Wardrobe,</span><br />
                <span className="gradient-text font-normal">Curated by AI</span>
              </h1>
            </div>
            
            <p className="text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl fade-in-up" style={{ animationDelay: '0.3s' }}>
              Discover a capsule wardrobe meticulously tailored to your unique preferences, lifestyle, and aesthetic through our sophisticated AI styling platform.
            </p>
            
            <div className="flex gap-6 fade-in-up" style={{ animationDelay: '0.5s' }}>
              <Button 
                variant="luxury"
                size="lg"
                onClick={() => navigate(user ? "/survey" : "/auth")}
                className="text-base px-12 h-14"
              >
                Begin Your Journey <ArrowRight className="ml-2" />
              </Button>
              {!user && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="text-base px-10 h-14 font-light"
                >
                  Sign In
                </Button>
              )}
            </div>

            <div className="flex gap-12 pt-8 fade-in-up" style={{ animationDelay: '0.7s' }}>
              <div>
                <p className="text-4xl font-light">10K+</p>
                <p className="text-sm text-muted-foreground mt-1">Curated Wardrobes</p>
              </div>
              <div>
                <p className="text-4xl font-light">95%</p>
                <p className="text-sm text-muted-foreground mt-1">Satisfaction Rate</p>
              </div>
              <div>
                <p className="text-4xl font-light">50+</p>
                <p className="text-sm text-muted-foreground mt-1">Partner Brands</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-secondary/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-6">Our Philosophy</p>
          <h2 className="text-5xl lg:text-6xl font-light leading-tight mb-8">
            Less is More.<br />
            <span className="italic font-normal">Quality Over Quantity.</span>
          </h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            We believe in the power of a thoughtfully curated wardrobe. Each piece serves a purpose, 
            reflects your personal style, and works harmoniously with others to create endless possibilities.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">The Process</p>
            <h2 className="text-5xl lg:text-6xl font-light">
              Three Simple Steps to<br />
              <span className="italic font-normal">Sartorial Excellence</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 max-w-6xl mx-auto">
            <div className="text-center space-y-6 group">
              <div className="w-24 h-24 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Palette className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Step One</p>
                <h3 className="text-3xl font-light">The Survey</h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  Share your style preferences, body type, lifestyle, and aesthetic through our comprehensive questionnaire.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6 group">
              <div className="w-24 h-24 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Step Two</p>
                <h3 className="text-3xl font-light">AI Curation</h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  Our sophisticated AI analyzes your responses and curates a personalized capsule wardrobe from premium brands.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6 group">
              <div className="w-24 h-24 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Step Three</p>
                <h3 className="text-3xl font-light">Refined Selection</h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  Review your curated pieces, make adjustments, and shop directly from our carefully selected brand partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-secondary/20">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Why StyleCapsule</p>
                <h2 className="text-5xl font-light leading-tight">
                  Elevate Your<br />
                  <span className="italic font-normal">Personal Style</span>
                </h2>
              </div>
              
              <div className="space-y-6">
                {[
                  "Curated by AI, refined by fashion experts",
                  "Sustainable approach to building your wardrobe",
                  "Pieces that work harmoniously together",
                  "Direct access to premium brand partners",
                  "Budget-conscious recommendations",
                  "Updated seasonally for your lifestyle"
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                    </div>
                    <p className="text-lg font-light">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-card p-12 rounded-lg shadow-elegant">
              <blockquote className="space-y-6">
                <p className="text-2xl font-light leading-relaxed italic">
                  "StyleCapsule transformed how I approach fashion. Every piece in my wardrobe now serves a purpose and makes me feel confident."
                </p>
                <footer className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary" />
                  <div>
                    <p className="font-normal">Sarah Mitchell</p>
                    <p className="text-sm text-muted-foreground">Creative Director</p>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Begin Today</p>
              <h2 className="text-6xl lg:text-7xl font-light leading-tight">
                Ready to Transform<br />
                <span className="italic font-normal">Your Wardrobe?</span>
              </h2>
            </div>
            
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Join a community of discerning individuals who have discovered the power of a perfectly curated wardrobe.
            </p>
            
            <div className="pt-4">
              <Button 
                variant="luxury"
                size="lg"
                onClick={() => navigate(user ? "/survey" : "/auth")}
                className="text-base px-12 h-14"
              >
                Start Your Style Journey <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-light tracking-tight mb-2">StyleCapsule</h3>
              <p className="text-sm text-muted-foreground font-light">Intelligent Fashion Curation</p>
            </div>
            <p className="text-sm text-muted-foreground font-light">
              &copy; 2024 StyleCapsule. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;