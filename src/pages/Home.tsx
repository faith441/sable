import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-wardrobe.jpg";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalSlides = 7;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
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

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToSlide(index: number) {
    const container = scrollContainerRef.current;
    if (!container) return;

    const slideWidth = container.offsetWidth;
    container.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth',
    });
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            onClick={() => navigate(user ? "/wardrobe" : "/")}
            className="text-2xl font-light tracking-tight cursor-pointer hover:text-primary transition-colors"
          >
            Sable
          </h1>
          <div className="flex gap-2 items-center">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")} className="font-light text-xs">
                  My Wardrobe
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="font-light text-xs">
                  Logout
                </Button>
              </>
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
        className="flex h-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory hide-scrollbar pt-24"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >

        {/* Slide 1: The Issue */}
        <section className="relative min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center overflow-y-auto px-6 py-6">
          <div className="absolute inset-0 z-0">
            <img src={heroImage} alt="Curated wardrobe" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          </div>
          
          <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-6">
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">The Issue</p>
              <h1 className="text-3xl font-light leading-tight">
                Most people don't need<br />
                <span className="italic font-normal">more clothes.</span>
              </h1>
              <h2 className="text-2xl font-normal gradient-text">
                They need a cohesive<br />personal brand.
              </h2>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground font-light leading-relaxed">
              <p>You buy random pieces that don't match.</p>
              <p>You guess on colors.</p>
              <p>Your closet is full…<br />but you still feel like you have <em>nothing to wear</em>.</p>
              <p className="text-foreground font-normal pt-2">Your wardrobe becomes noise.<br />Not identity.</p>
            </div>
          </div>
        </section>

        {/* Slide 2: The Pattern */}
        <section className="min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">So What Do You Do?</p>
              <h2 className="text-2xl font-light leading-tight">
                Do you keep <span className="italic">wasting money?</span><br />
                Do you hire 5 different "experts"?<br />
                Do you keep <span className="italic">guessing</span> every morning?
              </h2>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground font-light leading-relaxed">
              <p>Standing there, hoping the outfit works…<br />
              hoping today you'll finally feel like <em>"you."</em></p>
              <p className="text-foreground font-normal pt-3">Your style shouldn't be a question.<br />
              <span className="gradient-text text-lg">It should be a statement.</span></p>
            </div>
          </div>
        </section>

        {/* Slide 3: The Solution */}
        <section className="min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center bg-gradient-to-b from-secondary/20 to-background px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">The Solution</p>
              <h2 className="text-xl font-normal leading-snug">
                ONE ADVISOR. ONE APP.<br />ONE CAPSULE SYSTEM.
              </h2>
              <h3 className="text-2xl font-light leading-tight">
                Meet <span className="gradient-text font-normal text-3xl">Sable</span>
              </h3>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground font-light leading-relaxed">
              <p>Your AI stylist, virtual try-on tool,<br />
              and shoppable capsule wardrobes<br />
              — all in one place.</p>
              
              <p className="text-foreground font-normal pt-3">
                A single platform that aligns your identity,<br />lifestyle, and aesthetic into one clear direction.
              </p>
            </div>
          </div>
        </section>

        {/* Slide 4: Who It's For */}
        <section className="min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="space-y-3 text-center animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">Who It's For</p>
              <h2 className="text-2xl font-light leading-tight">
                For busy people who need<br />
                <span className="gradient-text font-normal">an infrastructure of confidence.</span>
              </h2>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground font-light leading-relaxed">
              <p className="text-center">Your life is full.<br />
              Your time is limited.<br />
              <span className="text-foreground font-normal">Your image should work for you.</span></p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal mb-1">Fit</h4>
                <p className="text-xs text-muted-foreground font-light">Tailored to you</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal mb-1">Color</h4>
                <p className="text-xs text-muted-foreground font-light">Perfect palette</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal mb-1">Lifestyle</h4>
                <p className="text-xs text-muted-foreground font-light">Built for your life</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card text-center hover-scale">
                <h4 className="font-normal mb-1">Consistency</h4>
                <p className="text-xs text-muted-foreground font-light">Every single day</p>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 5: The Result */}
        <section className="min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">The Result</p>
              <h2 className="text-2xl font-light leading-tight">
                You become the person<br />who looks <span className="gradient-text font-normal italic">dialed-in</span><br />every day.
              </h2>
            </div>
            
            <div className="grid gap-3 text-left">
              <div className="p-4 rounded-lg border border-border bg-card hover-scale">
                <h4 className="font-normal text-sm mb-1">✓ Capsule wardrobe you can actually buy</h4>
                <p className="text-xs text-muted-foreground font-light">Cohesive pieces that work together</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card hover-scale">
                <h4 className="font-normal text-sm mb-1">✓ Outfits auto-planned for the week</h4>
                <p className="text-xs text-muted-foreground font-light">No more morning guesswork</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card hover-scale">
                <h4 className="font-normal text-sm mb-1">✓ AI stylist in your pocket</h4>
                <p className="text-xs text-muted-foreground font-light">Expert advice, anytime</p>
              </div>
            </div>
            
            <p className="text-sm text-foreground font-light leading-relaxed pt-3">
              Your wardrobe becomes a <span className="font-normal">curated system</span> —<br />
              working on purpose, not on accident.
            </p>
          </div>
        </section>

        {/* Slide 6: How It Works */}
        <section className="min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center bg-gradient-to-b from-secondary/20 to-background px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="space-y-3 text-center animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">How It Works</p>
              <h2 className="text-2xl font-light leading-tight">
                Simple, Clear Steps
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3 p-4 rounded-lg border border-border bg-card hover-scale">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-light text-sm">1</div>
                <div>
                  <h4 className="font-normal text-sm mb-1">Browse curated capsule wardrobes</h4>
                  <p className="text-xs text-muted-foreground font-light">Tailored collections for every style</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border border-border bg-card hover-scale">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-light text-sm">2</div>
                <div>
                  <h4 className="font-normal text-sm mb-1">Shop from top fashion brands</h4>
                  <p className="text-xs text-muted-foreground font-light">Discover and purchase pieces you love</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-lg border border-border bg-card hover-scale">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-light text-sm">3</div>
                <div>
                  <h4 className="font-normal text-sm mb-1">Build your perfect wardrobe</h4>
                  <p className="text-xs text-muted-foreground font-light">No overwhelming browsing. No guesswork.</p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-foreground font-normal pt-3">
              Your personal brand, streamlined.
            </p>
          </div>
        </section>

        {/* Slide 7: CTA */}
        <section className="min-w-full h-full flex-shrink-0 snap-start flex items-center justify-center px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-3xl font-light leading-tight">
                Ready to Elevate<br />Your <span className="gradient-text font-normal italic">Personal Brand?</span>
              </h2>
              
              <div className="space-y-2 text-sm text-muted-foreground font-light">
                <p>No account required.</p>
                <p>No commitment.</p>
                <p className="text-foreground font-normal">Just clarity.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-light">
                Discover your curated wardrobe<br />
                — built around you —<br />
                and start elevating your style today.
              </p>
              
              <Button
                variant="luxury"
                size="lg"
                onClick={() => {
                  if (user) {
                    localStorage.setItem('auto_generate_recommendations', 'true');
                    navigate("/ai-style-chat");
                  } else {
                    // Redirect to auth page if not signed in
                    navigate("/auth");
                  }
                }}
                className="w-full max-w-xs mx-auto hover-scale"
              >
                Browse Recommendations <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
