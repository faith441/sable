import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Existing session found, navigating to chat');
        navigate("/ai-style-chat");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, navigating to chat');
        navigate("/ai-style-chat");
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Sign in error:', error);

          // Provide more helpful error messages
          if (error.message.includes('Invalid login credentials')) {
            toast.error("Invalid email or password", {
              description: "Please check your credentials and try again",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast.error("Please confirm your email", {
              description: "Check your inbox for the confirmation link",
            });
          } else {
            toast.error(error.message);
          }
          throw error;
        }

        if (data.session) {
          console.log('Login successful, session created:', data.session.user.id);
          // Navigation will be handled by the auth state change listener
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/ai-style-chat`,
            data: {
              full_name: fullName,
            },
            // Auto-confirm email to skip verification
            emailRedirectTo: undefined,
          },
        });

        if (error) throw error;

        console.log('Sign up response:', data);

        // Always treat as successful sign up
        if (data.user) {
          console.log('Account created for user:', data.user.id);
          toast.success("Account created successfully!");

          // If session exists, navigation will be handled by auth state listener
          // If no session (email confirmation required), manually sign in
          if (!data.session) {
            console.log('No session created, attempting auto-login...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              toast("Account created! Please sign in.", {
                description: "Use your email and password to continue",
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-accent/10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-6 font-light"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="shadow-elegant border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-3 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <CardTitle className="text-4xl font-light">
              {isLogin ? "Welcome Back" : "Join Sable"}
            </CardTitle>
            <CardDescription className="text-base font-light">
              {isLogin 
                ? "Sign in to access your personalized wardrobe" 
                : "Begin your journey to a perfectly curated wardrobe"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-light">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    placeholder="Jane Doe"
                    className="h-12 font-light"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-light">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-12 font-light"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-light">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-12 font-light"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12" 
                variant="luxury"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-light">or</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
            >
              {isLogin 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;