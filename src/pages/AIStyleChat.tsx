import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, Sparkles, Loader2, Image as ImageIcon, X, Heart, ShoppingBag, Mic, ShirtIcon, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { saveOutfitRecommendations } from "@/utils/outfitStorage";

interface OutfitRecommendation {
  name: string;
  items: Array<{
    name: string;
    category: string;
    image_url?: string;
  }>;
  style: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // Base64 encoded images
  outfits?: OutfitRecommendation[]; // Outfit recommendations
}

const AIStyleChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [closetMode, setClosetMode] = useState<'general' | 'closet' | 'shopping'>('general');
  const [userGender, setUserGender] = useState<'woman' | 'man' | null>(null);
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
    // Don't load old messages - start fresh each time
    // loadMessages();

    // Check if gender is already stored
    const storedGender = localStorage.getItem('user_gender');

    // Check if we should auto-generate recommendations
    const autoGenerate = localStorage.getItem('auto_generate_recommendations');
    if (autoGenerate === 'true') {
      localStorage.removeItem('auto_generate_recommendations');

      // Check if gender is selected, otherwise show gender selection
      if (!storedGender) {
        // Don't auto-generate, let user select gender first
        showWelcomeMessage();
        setShowGenderSelection(true);
        return;
      }

      // Load the stored gender for auto-generate flow
      setUserGender(storedGender as 'woman' | 'man');

      // Auto-generate recommendations and navigate to full-screen view
      setTimeout(async () => {
        try {
          // Generate outfits directly with gender
          const outfits = generateMockOutfits("professional work outfits", storedGender as 'woman' | 'man');

          // Add weather data and gender to outfits
          const outfitsWithWeather = outfits.map(outfit => ({
            ...outfit,
            gender: storedGender,
            weather: {
              temp: 61,
              high: 64,
              low: 57
            }
          }));

          // Store outfits in both Supabase and localStorage
          await saveOutfitRecommendations(outfitsWithWeather);

          // Navigate to full-screen outfit recommendations page
          navigate('/outfit-recommendations');
        } catch (error: any) {
          console.error("Error:", error);
          toast.error("Failed to get recommendations");
        }
      }, 1000);
    } else {
      // Normal chat flow - always clear stored gender for fresh selection
      localStorage.removeItem('user_gender');
      setUserGender(null);
      showWelcomeMessage();
      console.log('Normal chat flow - gender cleared, will prompt after first message');
    }
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
        content: msg.content,
        images: msg.content.includes('[IMAGE]') ? [] : undefined // Placeholder for saved images
      })));
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const showWelcomeMessage = () => {
    const preferences = localStorage.getItem('guest_preferences');
    const userName = preferences ? JSON.parse(preferences).name : null;
    const greeting = userName ? `Good morning, ${userName}` : 'Good morning!';
    const welcomeText = `${greeting}\nHow can I style you?`;

    // Always show the same welcome message
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

  const handleGenderSelection = async (gender: 'woman' | 'man') => {
    console.log('=== GENDER SELECTED ===', gender);
    setUserGender(gender);
    localStorage.setItem('user_gender', gender);
    setShowGenderSelection(false);
    setLoading(true);

    try {
      // Get the user's original message (second to last message before gender prompt)
      const userMessages = messages.filter(m => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];

      console.log('Generating outfits for:', lastUserMessage?.content);

      // Generate outfits based on user's message and gender
      const outfits = generateMockOutfits(lastUserMessage?.content || "professional style", gender);

      // Add weather data and gender to outfits
      const outfitsWithWeather = outfits.map(outfit => ({
        ...outfit,
        gender: gender,
        weather: {
          temp: 61,
          high: 64,
          low: 57
        }
      }));

      console.log('Generated outfits:', outfitsWithWeather.length);

      // Store outfits - if this fails, still navigate
      try {
        await saveOutfitRecommendations(outfitsWithWeather);
        console.log('✅ Outfits saved successfully');
      } catch (saveError) {
        console.warn('Failed to save outfits to Supabase, but continuing:', saveError);
        // Still store in localStorage as fallback
        localStorage.setItem('current_outfits', JSON.stringify(outfitsWithWeather));
      }

      console.log('Navigating to outfit recommendations...');

      // Navigate immediately to outfit recommendations page with outfits in state
      navigate('/outfit-recommendations', {
        state: { outfits: outfitsWithWeather },
        replace: true
      });

      // Reset loading state after navigation
      setLoading(false);
    } catch (error: any) {
      console.error("Error generating outfits:", error);
      toast.error("Failed to generate recommendations");
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 3;
    if (uploadedImages.length + files.length > maxImages) {
      toast.error(`You can upload up to ${maxImages} images`);
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image must be less than 20MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateMockOutfits = (query: string, gender: 'woman' | 'man'): OutfitRecommendation[] => {
    // Return gender-specific outfits
    if (gender === 'man') {
      return [
        {
          name: "Business Professional",
          style: "professional",
          items: [
            { name: "Navy Suit Jacket", category: "Blazer", image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop" },
            { name: "White Dress Shirt", category: "Shirt", image_url: "https://images.unsplash.com/photo-1602810318660-d2c46b45a6a1?w=400&h=600&fit=crop" },
            { name: "Navy Dress Pants", category: "Pants", image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=600&fit=crop" },
            { name: "Black Leather Dress Shoes", category: "Shoes", image_url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=600&fit=crop" }
          ]
        },
        {
          name: "Smart Casual",
          style: "casual",
          items: [
            { name: "Charcoal Blazer", category: "Blazer", image_url: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=600&fit=crop" },
            { name: "Polo Shirt", category: "Shirt", image_url: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=600&fit=crop" },
            { name: "Chinos", category: "Pants", image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=600&fit=crop" },
            { name: "Loafers", category: "Shoes", image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=600&fit=crop" }
          ]
        },
        {
          name: "Weekend Casual",
          style: "weekend",
          items: [
            { name: "Denim Jacket", category: "Jacket", image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=600&fit=crop" },
            { name: "Henley Shirt", category: "Shirt", image_url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=600&fit=crop" },
            { name: "Dark Jeans", category: "Jeans", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop" },
            { name: "Sneakers", category: "Shoes", image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop" }
          ]
        }
      ];
    }

    // Women's outfits
    return [
      {
        name: "Office Comfort",
        style: "professional-casual",
        items: [
          { name: "Classic Black Blazer", category: "Blazer", image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=600&fit=crop" },
          { name: "Brown Cashmere Sweater", category: "Sweater", image_url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=600&fit=crop" },
          { name: "Olive Wide-Leg Trousers", category: "Pants", image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop" },
          { name: "Black Heeled Pumps", category: "Shoes", image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=600&fit=crop" }
        ]
      },
      {
        name: "Business Chic",
        style: "modern-professional",
        items: [
          { name: "Navy Tailored Blazer", category: "Blazer", image_url: "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=400&h=600&fit=crop" },
          { name: "White Silk Blouse", category: "Top", image_url: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400&h=600&fit=crop" },
          { name: "Black Pencil Skirt", category: "Skirt", image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=600&fit=crop" },
          { name: "Nude Pointed Heels", category: "Shoes", image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=600&fit=crop" }
        ]
      },
      {
        name: "Casual Friday",
        style: "smart-casual",
        items: [
          { name: "Camel Trench Coat", category: "Coat", image_url: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&h=600&fit=crop" },
          { name: "Striped Button-Down", category: "Top", image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop" },
          { name: "Dark Wash Jeans", category: "Jeans", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop" },
          { name: "Loafers", category: "Shoes", image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=600&fit=crop" }
        ]
      }
    ];
  };

  const sendMessage = async () => {
    console.log('=== SEND MESSAGE CALLED ===');
    console.log('Input:', input);
    console.log('User Gender:', userGender);
    console.log('Loading:', loading);

    if ((!input.trim() && uploadedImages.length === 0) || loading) {
      console.log('Returning early - empty input or loading');
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input || (uploadedImages.length > 0 ? "What do you think of this outfit?" : ""),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined
    };

    console.log('Adding user message to chat');
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    const imagesToSend = [...uploadedImages];
    setUploadedImages([]);

    // Check if gender is selected after adding user message
    if (!userGender) {
      console.log('No gender selected - showing gender prompt');
      // Show gender selection after user's message
      const genderPrompt: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Before I create your recommendations, are you shopping for women's or men's fashion?"
      };
      setMessages(prev => [...prev, genderPrompt]);
      setShowGenderSelection(true);
      console.log('Gender selection should now be visible');
      return;
    }

    console.log('Gender already selected - generating outfits');

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      // Don't save messages to database - fresh conversations each time
      // await supabase.from("chat_messages").insert({
      //   user_id: user?.id,
      //   session_id: !user ? sessionId : null,
      //   role: 'user',
      //   content: userMessage.content + (imagesToSend.length > 0 ? ' [IMAGE]' : '')
      // });

      // Generate outfits based on user's message and gender
      const outfits = generateMockOutfits(userMessage.content, userGender);

      // Add weather data and gender to outfits
      const outfitsWithWeather = outfits.map(outfit => ({
        ...outfit,
        gender: userGender,
        weather: {
          temp: 61,
          high: 64,
          low: 57
        }
      }));

      // Store outfits and gender in both Supabase and localStorage
      await saveOutfitRecommendations(outfitsWithWeather);
      localStorage.setItem('user_gender', userGender);

      // Navigate immediately to outfit recommendations page (no chat reply)
      navigate('/outfit-recommendations');

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#F5F5DC] via-[#FAFAF8] to-white">
      {/* Minimalist Header - only show back button if there are messages */}
      {messages.length > 1 && (
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate("/wardrobe")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {messages.length <= 1 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="space-y-6">
              <h1 className="text-3xl font-normal leading-tight whitespace-pre-line">
                {messages[0]?.content || "Good morning!\nHow can I style you?"}
              </h1>

              {/* Gender Selection Buttons */}
              {showGenderSelection && (
                <div className="flex flex-col gap-3 mt-8 max-w-sm mx-auto">
                  <button
                    onClick={() => handleGenderSelection('woman')}
                    className="bg-black text-white py-4 px-6 rounded-full font-normal text-base hover:bg-gray-800 transition-colors"
                  >
                    Women's Fashion
                  </button>
                  <button
                    onClick={() => handleGenderSelection('man')}
                    className="border-2 border-black text-black py-4 px-6 rounded-full font-normal text-base hover:bg-gray-50 transition-colors"
                  >
                    Men's Fashion
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((message, idx) => {
              // Skip rendering the welcome message if it's the only message
              if (idx === 0 && messages.length === 1) return null;

              const isLastMessage = idx === messages.length - 1;

              return (
                <div key={message.id}>
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                  <div className={`max-w-[80%] rounded-3xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-200'
                  }`}>
                    {message.images && message.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {message.images.map((img, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={img}
                            alt={`Outfit ${imgIdx + 1}`}
                            className="rounded-lg w-full h-32 object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm font-normal whitespace-pre-wrap leading-relaxed">{message.content}</p>

                  {/* Outfit Recommendations - Style Categorized */}
                  {message.outfits && message.outfits.length > 0 && (
                    <div className="mt-4 space-y-6">
                      {message.outfits.map((outfit, outfitIdx) => (
                        <div key={outfitIdx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                          {/* Style Name */}
                          <div className="px-4 pt-4 pb-2">
                            <h3 className="text-lg font-normal">{outfit.name}</h3>
                          </div>

                          {/* Individual Items Grid */}
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-3">
                              {outfit.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="space-y-2">
                                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
                                    {item.image_url ? (
                                      <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm">
                                    <p className="font-normal text-gray-900 line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="px-4 pb-4 flex gap-2">
                            <button
                              onClick={() => {
                                localStorage.setItem('virtual-tryon-outfit', JSON.stringify(outfit));
                                navigate("/virtual-tryon");
                              }}
                              className="flex-1 bg-black text-white py-2.5 rounded-full font-normal text-sm hover:bg-gray-800 transition-colors"
                            >
                              Create Avatar
                            </button>
                            <button
                              onClick={() => toast.success("Outfit saved!")}
                              className="px-4 py-2.5 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                            >
                              <Heart className="h-4 w-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                  </div>

                  {/* Show gender selection after assistant's prompt */}
                  {isLastMessage && showGenderSelection && message.role === 'assistant' && (
                    <div className="flex justify-center mt-4">
                      <div className="flex flex-col gap-3 max-w-sm">
                        <button
                          onClick={() => handleGenderSelection('woman')}
                          disabled={loading}
                          className="bg-black text-white py-3 px-6 rounded-full font-normal text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Women's Fashion
                        </button>
                        <button
                          onClick={() => handleGenderSelection('man')}
                          disabled={loading}
                          className="border-2 border-black text-black py-3 px-6 rounded-full font-normal text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Men's Fashion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Input - Alta Daily Style */}
      <div className="sticky bottom-0 p-4 pb-safe">
        <div className="max-w-lg mx-auto">
          {/* Image previews */}
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Upload ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Container */}
          <div className="bg-white rounded-[28px] shadow-lg border border-gray-200/50 px-4 py-3 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Left Icons */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadedImages.length >= 3}
              className="text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              <ShirtIcon className="h-5 w-5" />
            </button>

            {/* Closet Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  <span className="font-normal">
                    {closetMode === 'general' && 'General styling'}
                    {closetMode === 'closet' && 'Closet mode'}
                    {closetMode === 'shopping' && 'Shopping mode'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => setClosetMode('general')}>
                  <div className="flex flex-col">
                    <span className="font-normal text-sm">General styling</span>
                    <span className="text-xs text-muted-foreground">Style advice & recommendations</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setClosetMode('closet')}>
                  <div className="flex flex-col">
                    <span className="font-normal text-sm">Closet mode</span>
                    <span className="text-xs text-muted-foreground">Style items from your closet</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setClosetMode('shopping')}>
                  <div className="flex flex-col">
                    <span className="font-normal text-sm">Shopping mode</span>
                    <span className="text-xs text-muted-foreground">Find & purchase new items</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Input Field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="I want to look professional and sty"
              className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-gray-400"
              disabled={loading}
            />

            {/* Right Icons */}
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              <Mic className="h-5 w-5" />
            </button>

            <button
              onClick={sendMessage}
              disabled={(!input.trim() && uploadedImages.length === 0) || loading}
              className="bg-black text-white rounded-full p-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:hover:bg-black"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStyleChat;