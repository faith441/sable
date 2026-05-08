import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Heart, Link as LinkIcon, ThumbsDown, Share2, Sun, ExternalLink, Upload, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAffiliateLinks } from "../hooks/useAffiliateLinks";
import { useOutfitRecommendations } from "../hooks/useOutfitRecommendations";
import { getSessionId } from "@/utils/outfitStorage";
import { supabase } from "@/integrations/supabase/client";

interface OutfitItem {
  name: string;
  category: string;
  image_url?: string;
}

interface Outfit {
  name: string;
  style: string;
  items: OutfitItem[];
  weather?: {
    temp: number;
    high: number;
    low: number;
  };
}

const OutfitRecommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { links: affiliateLinks, getByCategory } = useAffiliateLinks();
  const { outfits: dbOutfits, loading, getSessionId: getDbSessionId } = useOutfitRecommendations();

  // Try-on states
  const [userImage, setUserImage] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [processingTryOn, setProcessingTryOn] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);

  // Use outfits from navigation state if available, otherwise from database
  const stateOutfits = location.state?.outfits || [];
  const outfits = stateOutfits.length > 0 ? stateOutfits : dbOutfits;

  // Helper to find affiliate link for an item
  const getAffiliateLink = (item: OutfitItem) => {
    const categoryLinks = getByCategory(item.category);
    return categoryLinks.length > 0 ? categoryLinks[0]?.affiliateLink : null;
  };

  useEffect(() => {
    // Only redirect if we've finished loading AND have no outfits from either source
    if (!loading && outfits.length === 0 && stateOutfits.length === 0) {
      navigate('/ai-style-chat');
    }
  }, [loading, outfits, stateOutfits, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left - next outfit
      if (currentIndex < outfits.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }

    if (touchStart - touchEnd < -75) {
      // Swipe right - previous outfit
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(resizedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast.loading("Optimizing image...");
        const resizedImage = await resizeImage(file, 768, 1024);
        setUserImage(resizedImage);
        toast.dismiss();
        toast.success("Image uploaded!");
      } catch (error) {
        console.error("Error resizing image:", error);
        toast.error("Failed to process image");
      }
    }
  };

  const handleTryOn = async () => {
    if (!userImage) {
      toast.error("Please upload your photo");
      return;
    }

    setProcessingTryOn(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/virtual-tryon-idm`;

      const garmentSets = currentOutfit.items.map((item) => ({
        label: item.name,
        garments: [{
          image_url: item.image_url,
          name: item.name,
          category: item.category
        }]
      }));

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPhoto: userImage,
          garmentSets,
          sessionId: getSessionId()
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limited. Please try again later.");
        } else if (response.status === 402) {
          throw new Error("AI credits exhausted. Please contact support.");
        } else if (response.status === 502) {
          throw new Error("Try-on failed. Please try again.");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Get the first successful result
      if (data.results && data.results.length > 0) {
        const firstSuccess = data.results.find((r: any) => r.success && r.image);
        if (firstSuccess) {
          setTryOnResult(firstSuccess.image);

          // Get user ID or session ID
          const { data: { user } } = await supabase.auth.getUser();
          const sessionId = !user ? (localStorage.getItem('guest_session_id') || crypto.randomUUID()) : null;
          if (!user && sessionId) {
            localStorage.setItem('guest_session_id', sessionId);
          }

          // Save try-on results to localStorage for immediate display
          const TRYON_CACHE_KEY = 'ai_tryon_image_cache';
          let tryOnCache: Map<string, string>;
          try {
            const stored = localStorage.getItem(TRYON_CACHE_KEY);
            tryOnCache = stored ? new Map<string, string>(JSON.parse(stored)) : new Map();
          } catch (e) {
            tryOnCache = new Map();
          }

          // Save each successful result to database and localStorage
          for (let idx = 0; idx < currentOutfit.items.length; idx++) {
            const item = currentOutfit.items[idx];
            const result = data.results[idx];

            if (result?.success && result?.image && item.image_url) {
              // Save to localStorage cache
              tryOnCache.set(item.image_url, result.image);

              // Save to database
              try {
                await supabase.from('virtual_tryons').insert({
                  user_id: user?.id || null,
                  session_id: sessionId,
                  product_id: null, // Can be added if outfit items have IDs
                  product_name: item.name,
                  product_image_url: item.image_url,
                  product_category: item.category,
                  tryon_image_url: result.image
                });
              } catch (dbError) {
                console.error('Failed to save try-on to database:', dbError);
              }
            }
          }

          // Save localStorage cache
          try {
            localStorage.setItem(TRYON_CACHE_KEY, JSON.stringify(Array.from(tryOnCache.entries())));
          } catch (e) {
            console.error('Failed to save try-on cache:', e);
          }

          toast.success("Try-on complete and saved!");
        } else {
          throw new Error("No successful try-on results");
        }
      } else {
        throw new Error("No results generated");
      }

    } catch (error: any) {
      console.error("Virtual try-on error:", error);
      toast.error(error.message || "Failed to process try-on");
    } finally {
      setProcessingTryOn(false);
    }
  };

  if (outfits.length === 0) {
    return null;
  }

  const currentOutfit = outfits[currentIndex];
  const weather = currentOutfit.weather || { temp: 61, high: 64, low: 57 };

  return (
    <div
      className="min-h-screen bg-white flex flex-col safe-area-inset"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => navigate('/wardrobe')}
          className="p-2.5 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-contain">
        <div className="max-w-2xl mx-auto px-4 pb-6">

          {/* Weather Badge - Positioned above items */}
          <div className="flex justify-end pt-2 pb-4">
            <div className="flex items-center gap-1 text-xs sm:text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span className="font-medium">{weather.temp}°</span>
              <span className="text-gray-500">H:{weather.high}° L:{weather.low}°</span>
            </div>
          </div>

          {/* Top Items Display - Mobile Optimized */}
          <div className="pb-6">
            {/* Top 3 Items - Responsive sizing */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 min-h-[140px] sm:min-h-[160px]">
              {currentOutfit.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-28 sm:w-24 sm:h-32 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gray-100 rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 py-2">
            {outfits.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-black'
                    : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Outfit Name & Count */}
          <div className="flex items-center justify-between py-5">
            <h2 className="text-xl sm:text-2xl font-normal">{currentOutfit.name}</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {currentIndex + 1}/{outfits.length}
            </span>
          </div>

          {/* Individual Items Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {currentOutfit.items.map((item, idx) => {
              const affiliateLink = getAffiliateLink(item);
              return (
                <div key={idx} className="space-y-2">
                  <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden relative group">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs sm:text-sm">{item.category}</span>
                      </div>
                    )}
                    {affiliateLink && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Affiliate
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-1 space-y-1.5">
                    <p className="text-sm font-normal line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                    {affiliateLink && (
                      <a
                        href={affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => toast.success("Opening shop page...")}
                        className="inline-flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors touch-manipulation w-full justify-center"
                      >
                        <span>Shop</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Photo Upload Card - Below Items */}
          {!tryOnResult && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-normal mb-4">Try On This Outfit</h3>
              {!userImage ? (
                <label className="block cursor-pointer">
                  <div className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-black transition-colors bg-gray-50">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700">Upload Your Photo</p>
                    <p className="text-xs text-gray-500 mt-1">Tap to select from your device</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUserImageUpload}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                    <img src={userImage} alt="Your photo" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={handleTryOn}
                    disabled={processingTryOn}
                    className="w-full bg-black text-white px-4 py-3 rounded-full font-normal text-sm hover:bg-gray-800 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingTryOn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Try-On...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Process Try-On
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setUserImage(null)}
                    className="w-full text-gray-600 text-sm hover:text-gray-800"
                  >
                    Change Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Try-On Result */}
          {tryOnResult && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-normal">Your Try-On Result</h3>
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
                <img src={tryOnResult} alt="Try-on result" className="w-full h-full object-cover" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => {
                    toast.success("Items added to cart!");
                    setTimeout(() => navigate('/cart'), 800);
                  }}
                  className="flex-1 bg-black text-white px-4 py-3 rounded-full font-normal text-sm hover:bg-gray-800 active:scale-95 transition-all touch-manipulation"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => navigate('/wardrobe')}
                  className="flex-1 bg-gray-100 text-black px-4 py-3 rounded-full font-normal text-sm hover:bg-gray-200 active:scale-95 transition-all touch-manipulation"
                >
                  Go Back Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitRecommendations;
