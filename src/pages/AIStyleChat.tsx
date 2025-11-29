import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIStyleChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    loadMessages();
    showWelcomeMessage();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const getSessionId = () => {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('guest_session_id', sessionId);
    }
    return sessionId;
  };

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      const query = supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (user) {
        query.eq("user_id", user.id);
      } else {
        query.eq("session_id", sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setMessages((data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })));
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const showWelcomeMessage = () => {
    const preferences = localStorage.getItem('guest_preferences');
    if (!preferences) return;

    const userPrefs = JSON.parse(preferences);
    const welcomeText = `Hello! How can I help you today? Whether you're looking for a quick style tip, advice on building a versatile wardrobe, or a fresh outfit idea, I'm here to assist. Just tell me what you're looking for! 😊`;

    // Only show if no messages exist
    setTimeout(() => {
      setMessages(prev => {
        if (prev.length === 0) {
          return [{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: welcomeText
          }];
        }
        return prev;
      });
    }, 500);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      // Save user message
      await supabase.from("chat_messages").insert({
        user_id: user?.id,
        session_id: !user ? sessionId : null,
        role: 'user',
        content: userMessage.content
      });

      // Get user preferences from localStorage
      const preferences = localStorage.getItem('guest_preferences');
      const userPreferences = preferences ? JSON.parse(preferences) : null;

      // Call AI stylist edge function with user context
      const { data, error } = await supabase.functions.invoke("ai-stylist-chat", {
        body: { 
          message: userMessage.content, 
          userId: user?.id, 
          sessionId,
          userPreferences
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await supabase.from("chat_messages").insert({
        user_id: user?.id,
        session_id: !user ? sessionId : null,
        role: 'assistant',
        content: assistantMessage.content
      });

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-light">AI Stylist</h1>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-light">Your Personal Stylist</h2>
              <p className="text-muted-foreground font-light max-w-sm">
                Ask me anything about fashion, styling tips, or wardrobe recommendations
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] p-4 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card'
                }`}>
                  <p className="text-sm font-light whitespace-pre-wrap">{message.content}</p>
                </Card>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <Card className="p-4 bg-card">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-md p-4">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about styling, colors, trends..."
            className="flex-1"
            disabled={loading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || loading}
            variant="luxury"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIStyleChat;