import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MessageCircle, Scan } from "lucide-react";
import heroImage from "@/assets/hero-wardrobe.jpg";
import MobileNav from "@/components/MobileNav";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalSlides = 7;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const slideWidth = container.offsetWidth;
      const newSlide = Math.round(container.scrollLeft / slideWidth);
      setCurrentSlide(newSlide);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const slideWidth = container.offsetWidth;
    container.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth'
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
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

      {/* Slide Indicators */}
      <div className="fixed top-20 left-0 right-0 z-40 flex justify-center gap-2 px-4">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            className={`h-1 rounded-full transition-all ${
              currentSlide === index 
                ? 'w-8 bg-primary' 
                : 'w-1 bg-border hover:bg-muted-foreground'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex h-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth hide-scrollbar pt-28"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >

        {/* Slide 1: The Issue */}
        <section className="relative min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={heroImage} alt="Curated wardrobe" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          </div>
          
          <div className="relative z-10 max-w-lg mx-auto px-6 text-center space-y-8">
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">The Issue</p>
              <h1 className="text-4xl md:text-5xl font-light leading-tight">
                Most people don't need<br />
                <span className="italic font-normal">more clothes.</span>
              </h1>
              <h2 className="text-3xl md:text-4xl font-normal gradient-text">
                They need a cohesive<br />personal brand.
              </h2>
            </div>
            
            <div className="space-y-4 text-base text-muted-foreground font-light leading-relaxed max-w-md mx-auto">
              <p>You buy random pieces that don't match.</p>
              <p>You guess on colors.</p>
              <p>Your closet is full…<br />but you still feel like you have <em>nothing to wear</em>.</p>
              <p className="text-foreground font-normal pt-2">Your wardrobe becomes noise.<br />Not identity.</p>
            </div>
          </div>
        </section>

        {/* Slide 2: The Pattern */}
        <section className="min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-6">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">So What Do You Do?</p>
              <h2 className="text-3xl md:text-4xl font-light leading-tight">
                Do you keep <span className="italic">wasting money?</span><br />
                Do you hire 5 different "experts"?<br />
                Do you keep <span className="italic">guessing</span> every morning?
              </h2>
            </div>
            
            <div className="space-y-4 text-base text-muted-foreground font-light leading-relaxed">
              <p>Standing there, hoping the outfit works…<br />
              hoping today you'll finally feel like <em>"you."</em></p>
              <p className="text-foreground font-normal text-lg pt-4">Your style shouldn't be a question.<br />
              <span className="gradient-text text-xl">It should be a statement.</span></p>
            </div>
          </div>
        </section>

        {/* Slide 3: The Solution */}
        <section className="min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center bg-gradient-to-b from-secondary/20 to-background px-6">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">The Solution</p>
              <h2 className="text-2xl md:text-3xl font-normal leading-snug">
                ONE ADVISOR. ONE APP.<br />ONE CAPSULE SYSTEM.
              </h2>
              <h3 className="text-3xl md:text-4xl font-light leading-tight">
                Meet <span className="gradient-text font-normal text-4xl md:text-5xl">StyleCapsule</span>
              </h3>
            </div>
            
            <div className="space-y-3 text-base text-muted-foreground font-light leading-relaxed">
              <p>Your interactive style survey,<br />
              your AI stylist,<br />
              your virtual try-on tool,<br />
              and your shoppable capsule wardrobes<br />
              <span className="text-foreground">— all built uniquely for you.</span></p>
              
              <p className="text-foreground font-normal text-lg pt-4">
                A single platform that aligns your identity,<br />lifestyle, and aesthetic into one clear direction.
              </p>
            </div>
            
            <Button variant="luxury" size="lg" onClick={() => navigate("/survey")} className="w-full max-w-xs mx-auto">
              Start Style Survey <ArrowRight className="ml-2" />
            </Button>
          </div>
        </section>

        {/* Slide 4: Who It's For */}
        <section className="min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center px-6">
          <div className="max-w-lg mx-auto space-y-8">
            <div className="space-y-4 text-center animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">Who It's For</p>
              <h2 className="text-3xl md:text-4xl font-light leading-tight">
                For busy people who need<br />
                <span className="gradient-text font-normal">an infrastructure of confidence.</span>
              </h2>
            </div>
            
            <div className="space-y-4 text-base text-muted-foreground font-light leading-relaxed">
              <p className="text-center">Your life is full.<br />
              Your time is limited.<br />
              <span className="text-foreground font-normal">Your image should work for you.</span></p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-6 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal text-lg mb-1">Fit</h4>
                <p className="text-sm text-muted-foreground font-light">Tailored to you</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal text-lg mb-1">Color</h4>
                <p className="text-sm text-muted-foreground font-light">Perfect palette</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal text-lg mb-1">Lifestyle</h4>
                <p className="text-sm text-muted-foreground font-light">Built for your life</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal text-lg mb-1">Consistency</h4>
                <p className="text-sm text-muted-foreground font-light">Every single day</p>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 5: The Result */}
        <section className="min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-6">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">The Result</p>
              <h2 className="text-3xl md:text-4xl font-light leading-tight">
                You become the person<br />who looks <span className="gradient-text font-normal italic">dialed-in</span><br />every day.
              </h2>
            </div>
            
            <div className="grid gap-4 text-left">
              <div className="p-6 rounded-lg border border-border bg-card hover-scale">
                <h4 className="font-normal mb-2">✓ Capsule wardrobe you can actually buy</h4>
                <p className="text-sm text-muted-foreground font-light">Cohesive pieces that work together</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover-scale">
                <h4 className="font-normal mb-2">✓ Outfits auto-planned for the week</h4>
                <p className="text-sm text-muted-foreground font-light">No more morning guesswork</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover-scale">
                <h4 className="font-normal mb-2">✓ AI stylist in your pocket</h4>
                <p className="text-sm text-muted-foreground font-light">Expert advice, anytime</p>
              </div>
            </div>
            
            <p className="text-base text-foreground font-light leading-relaxed pt-4">
              Your wardrobe becomes a <span className="font-normal">curated system</span> —<br />
              working on purpose, not on accident.
            </p>
          </div>
        </section>

        {/* Slide 6: How It Works */}
        <section className="min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center bg-gradient-to-b from-secondary/20 to-background px-6">
          <div className="max-w-lg mx-auto space-y-8">
            <div className="space-y-4 text-center animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-light leading-tight">
                Simple, Clear Steps
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-6 rounded-lg border border-border bg-card hover-scale">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-light">1</div>
                <div>
                  <h4 className="font-normal mb-1">Take the visual style survey</h4>
                  <p className="text-sm text-muted-foreground font-light">Interactive, image-based, fast</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-6 rounded-lg border border-border bg-card hover-scale">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-light">2</div>
                <div>
                  <h4 className="font-normal mb-1">Get your shoppable capsule wardrobes</h4>
                  <p className="text-sm text-muted-foreground font-light">Tailored to your budget, lifestyle & identity</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-6 rounded-lg border border-border bg-card hover-scale">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-light">3</div>
                <div>
                  <h4 className="font-normal mb-1">Save outfits & check out in minutes</h4>
                  <p className="text-sm text-muted-foreground font-light">No overwhelming browsing. No guesswork. No stylist fees.</p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-foreground font-normal text-lg pt-4">
              Your personal brand, streamlined.
            </p>
          </div>
        </section>

        {/* Slide 7: CTA */}
        <section className="min-w-full h-full flex-shrink-0 snap-center flex items-center justify-center px-6">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-light leading-tight">
                Ready to Elevate<br />Your <span className="gradient-text font-normal italic">Personal Brand?</span>
              </h2>
              
              <div className="space-y-2 text-base text-muted-foreground font-light">
                <p>No account required.</p>
                <p>No commitment.</p>
                <p className="text-foreground font-normal text-lg">Just clarity.</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground font-light max-w-md mx-auto">
                Start your style audit.<br />
                And see what a curated wardrobe<br />
                — built around you —<br />
                actually feels like.
              </p>
              
              <Button 
                variant="luxury" 
                size="lg" 
                onClick={() => navigate("/survey")}
                className="w-full max-w-sm mx-auto text-lg py-6 hover-scale"
              >
                Start Style Survey <ArrowRight className="ml-2" />
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-8">
              <button onClick={() => navigate("/ai-stylist")} className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-all hover-scale">
                <MessageCircle className="w-6 h-6 mx-auto mb-2 text-primary" strokeWidth={1.5} />
                <p className="text-xs font-light">AI Stylist</p>
              </button>
              <button onClick={() => navigate("/virtual-tryon")} className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-all hover-scale">
                <Scan className="w-6 h-6 mx-auto mb-2 text-primary" strokeWidth={1.5} />
                <p className="text-xs font-light">Try-On</p>
              </button>
              <button onClick={() => navigate(user ? "/outfit-planner" : "/auth")} className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-all hover-scale">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" strokeWidth={1.5} />
                <p className="text-xs font-light">Planner</p>
              </button>
            </div>
          </div>
        </section>
      </div>

      <MobileNav />
    </div>
  );
};

export default Index;
