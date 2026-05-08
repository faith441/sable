import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Heart, Link as LinkIcon, ThumbsDown, Share2, Sun, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAffiliateLinks } from "../hooks/useAffiliateLinks";
import { useOutfitRecommendations } from "../hooks/useOutfitRecommendations";

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
  const { outfits: dbOutfits, loading, getSessionId } = useOutfitRecommendations();

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

          {/* Action Buttons Row - Mobile Optimized */}
          <div className="flex items-center justify-between py-4 gap-2 border-b border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => toast.success("Added to favorites!")}
                className="p-2 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Like"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
                className="p-2 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Copy link"
              >
                <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => toast("Thanks for feedback!")}
                className="p-2 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Dislike"
              >
                <ThumbsDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: currentOutfit.name, url: window.location.href });
                  } else {
                    toast("Share feature not available");
                  }
                }}
                className="p-2 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Try On Button - Mobile Optimized */}
            <button
              onClick={() => navigate('/virtual-tryon', { state: { outfit: currentOutfit } })}
              className="bg-black text-white px-4 sm:px-6 py-2.5 rounded-full font-normal text-xs sm:text-sm hover:bg-gray-800 active:scale-95 transition-all touch-manipulation whitespace-nowrap"
            >
              Try On
            </button>
          </div>

          {/* Outfit Name & Count */}
          <div className="flex items-center justify-between py-5">
            <h2 className="text-xl sm:text-2xl font-normal">{currentOutfit.name}</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {currentIndex + 1}/{outfits.length}
            </span>
          </div>

          {/* Individual Items Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-safe">
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
        </div>
      </div>
    </div>
  );
};

export default OutfitRecommendations;
