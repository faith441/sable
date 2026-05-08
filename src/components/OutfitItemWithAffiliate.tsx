import { ExternalLink, ShoppingBag } from 'lucide-react';
import { useAffiliateLinks } from '../hooks/useAffiliateLinks';

interface OutfitItem {
  name: string;
  category: string;
  image_url?: string;
  brand?: string;
  price?: number;
  url?: string;
}

interface OutfitItemWithAffiliateProps {
  item: OutfitItem;
  onTryOn?: () => void;
}

export function OutfitItemWithAffiliate({ item, onTryOn }: OutfitItemWithAffiliateProps) {
  const { links, getByCategory } = useAffiliateLinks();

  // Try to find affiliate link for this item
  const categoryLinks = getByCategory(item.category);
  const affiliateLink = categoryLinks.length > 0 ? categoryLinks[0] : null;

  const buyLink = affiliateLink?.affiliateLink || item.url;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      {item.image_url && (
        <div className="aspect-[3/4] overflow-hidden bg-gray-100">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
          {item.brand && (
            <p className="text-xs text-gray-600 mt-1">{item.brand}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">{item.category}</span>
          {item.price && (
            <span className="text-sm font-semibold">${item.price}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onTryOn && (
            <button
              onClick={onTryOn}
              className="flex-1 bg-black text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              Try On
            </button>
          )}

          {buyLink && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white border-2 border-black text-black py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <ShoppingBag className="w-3 h-3" />
              {affiliateLink ? 'Shop' : 'View'}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Affiliate Badge */}
        {affiliateLink && (
          <div className="mt-2 flex items-center justify-center">
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              Affiliate Link • We earn from qualifying purchases
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
