import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Sparkles, Shirt, Calendar, MessageSquare, Check, ArrowRight, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-wardrobe.jpg";

const Marketing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    toast({
      title: "You're on the waitlist!",
      description: "We'll notify you when the app is available for download.",
    });
    setEmail("");
    setWaitlistOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header with Download Button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold gradient-text">Sable</div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => navigate("/blog")}
            >
              Blog
            </Button>
            <Button 
              variant="luxury" 
              size="lg"
              onClick={() => setWaitlistOpen(true)}
              className="gap-2"
            >
              <Download className="h-5 w-5" />
              Download App
            </Button>
          </div>
        </div>
      </header>

      {/* Waitlist Dialog */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Join the Waitlist</DialogTitle>
            <DialogDescription className="text-base">
              Get early access to the Sable app. Enter your email to join the waitlist and be notified when we launch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="waitlist-email">Email Address</Label>
              <Input
                id="waitlist-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="luxury" size="lg" className="w-full">
              Join Waitlist
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 pt-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-hero opacity-20 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <Badge variant="cream" className="text-sm px-4 py-2">
            AI-Powered Personal Styling
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Your Personal Brand,
            <br />
            <span className="gradient-text">Perfectly Curated</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop staring at a closet full of clothes with nothing to wear. 
            Discover your signature style with AI-powered capsule wardrobes tailored to your life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="luxury" 
              size="lg"
              onClick={() => navigate("/survey")}
              className="text-lg group"
            >
              Take Your Style Quiz
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg"
            >
              Sign In
            </Button>
          </div>
          
          <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-sage" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-sage" />
              <span>2 minute quiz</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              The Identity Problem
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Most people don't need more clothes. They need a cohesive personal brand.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="p-8 border-destructive/20 bg-destructive/5 space-y-4 hover-scale">
              <h3 className="text-2xl font-semibold text-destructive">The Struggle</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-destructive">×</span>
                  <span>Closet full of random pieces that don't match</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">×</span>
                  <span>"Nothing to wear" despite owning 100+ items</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">×</span>
                  <span>Decision fatigue every morning</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">×</span>
                  <span>Impulse purchases that never get worn</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-8 border-sage/20 bg-sage/5 space-y-4 hover-scale">
              <h3 className="text-2xl font-semibold text-sage">The Solution</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <Check className="h-5 w-5 text-sage shrink-0 mt-0.5" />
                  <span>Curated capsule wardrobe that works together</span>
                </li>
                <li className="flex gap-3">
                  <Check className="h-5 w-5 text-sage shrink-0 mt-0.5" />
                  <span>AI-powered recommendations for your lifestyle</span>
                </li>
                <li className="flex gap-3">
                  <Check className="h-5 w-5 text-sage shrink-0 mt-0.5" />
                  <span>Outfits planned for the entire week</span>
                </li>
                <li className="flex gap-3">
                  <Check className="h-5 w-5 text-sage shrink-0 mt-0.5" />
                  <span>Cohesive personal brand that aligns with your identity</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From style discovery to daily outfit planning, Sable is your complete wardrobe solution.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 space-y-4 hover-scale border-sage/20">
              <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-sage" />
              </div>
              <h3 className="text-xl font-semibold">AI Style Quiz</h3>
              <p className="text-muted-foreground">
                Answer 10 questions to discover your unique style profile and preferences
              </p>
            </Card>
            
            <Card className="p-6 space-y-4 hover-scale border-bronze/20">
              <div className="w-12 h-12 rounded-full bg-bronze/10 flex items-center justify-center">
                <Shirt className="h-6 w-6 text-bronze" />
              </div>
              <h3 className="text-xl font-semibold">Capsule Wardrobes</h3>
              <p className="text-muted-foreground">
                Get personalized capsule collections tailored to your style and lifestyle
              </p>
            </Card>
            
            <Card className="p-6 space-y-4 hover-scale border-clay/20">
              <div className="w-12 h-12 rounded-full bg-clay/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-clay" />
              </div>
              <h3 className="text-xl font-semibold">Outfit Planner</h3>
              <p className="text-muted-foreground">
                AI generates weekly outfits from your closet, accounting for weather and events
              </p>
            </Card>
            
            <Card className="p-6 space-y-4 hover-scale border-terracotta/20">
              <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-terracotta" />
              </div>
              <h3 className="text-xl font-semibold">AI Stylist Chat</h3>
              <p className="text-muted-foreground">
                Get real-time styling advice and recommendations anytime you need
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Your Journey to Confident Style
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-elegant mx-auto flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-elegant">
                1
              </div>
              <h3 className="text-2xl font-semibold">Discover Your Style</h3>
              <p className="text-muted-foreground">
                Take our 2-minute AI-powered quiz covering style preferences, body type, lifestyle, and more
              </p>
            </div>
            
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-elegant mx-auto flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-elegant">
                2
              </div>
              <h3 className="text-2xl font-semibold">Get Your Wardrobe</h3>
              <p className="text-muted-foreground">
                Receive AI-curated capsule wardrobes with clothing, fragrance, and hair care recommendations
              </p>
            </div>
            
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-elegant mx-auto flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-elegant">
                3
              </div>
              <h3 className="text-2xl font-semibold">Live Confidently</h3>
              <p className="text-muted-foreground">
                Plan weekly outfits, chat with your AI stylist, and never worry about what to wear again
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Built for Busy People Who Need Infrastructure of Confidence
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 border-sage/20">
              <div className="flex gap-1 text-bronze">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-muted-foreground italic">
                "Sable solved my 'nothing to wear' problem. Now I have a cohesive wardrobe that actually works together."
              </p>
              <div className="text-sm">
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-muted-foreground">Executive, San Francisco</p>
              </div>
            </Card>
            
            <Card className="p-6 space-y-4 border-bronze/20">
              <div className="flex gap-1 text-bronze">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-muted-foreground italic">
                "The AI stylist understands my lifestyle perfectly. Weekly outfit planning saves me hours every morning."
              </p>
              <div className="text-sm">
                <p className="font-semibold">Michael Rodriguez</p>
                <p className="text-muted-foreground">Entrepreneur, New York</p>
              </div>
            </Card>
            
            <Card className="p-6 space-y-4 border-clay/20">
              <div className="flex gap-1 text-bronze">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-muted-foreground italic">
                "Finally, a platform that aligns my wardrobe with my identity and lifestyle. It's like having a personal stylist 24/7."
              </p>
              <div className="text-sm">
                <p className="font-semibold">Emma Thompson</p>
                <p className="text-muted-foreground">Creative Director, London</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Style Stories - UGC Video Feed */}
      <section className="py-20 px-4 overflow-hidden bg-card/30">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Style Stories</h2>
            <p className="text-xl text-muted-foreground">
              Real people, real style transformations
            </p>
          </div>

          {/* Horizontal Scrolling Video Feed */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
              {[1, 2, 3, 4, 5].map((id) => (
                <VideoCard key={id} videoId={id} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold">
            Ready to Build Your Personal Brand?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Join thousands discovering their signature style with Sable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="luxury" 
              size="lg"
              onClick={() => navigate("/survey")}
              className="text-lg group shadow-elegant"
            >
              Start Your Style Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            No credit card required · 2 minute quiz · Instant results
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold gradient-text">Sable</div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <button onClick={() => navigate("/terms-and-conditions")} className="hover:text-foreground transition-colors">
              Terms
            </button>
            <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Video Card Component with simple auto-play
const VideoCard = ({ videoId }: { videoId: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="flex-shrink-0 snap-center">
      <Card className="overflow-hidden border-border/50 hover-scale w-[280px] h-[500px] bg-card/50">
        <div className="relative w-full h-full bg-muted">
          <video
            ref={videoRef}
            src={`/videos/ugc-${videoId}.mp4`}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </Card>
    </div>
  );
};

export default Marketing;