import { useState, useEffect } from 'react';
import { affiliateLoader, AffiliateLink } from '../utils/affiliateLoader';

/**
 * React hook to load and use affiliate links from CSV
 */
export function useAffiliateLinks() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAffiliateLinks();
  }, []);

  const loadAffiliateLinks = async () => {
    try {
      setLoading(true);
      // Load from public CSV file
      const loadedLinks = await affiliateLoader.loadFromFile('/affiliate_links.csv');
      setLinks(loadedLinks);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load affiliate links:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAffiliateUrl = (productUrl: string, retailer: string): string => {
    return affiliateLoader.convertToAffiliateUrl(productUrl, retailer);
  };

  const getByRetailer = (retailer: string): AffiliateLink[] => {
    return affiliateLoader.getByRetailer(retailer);
  };

  const getByCategory = (category: string): AffiliateLink[] => {
    return affiliateLoader.getByCategory(category);
  };

  return {
    links,
    loading,
    error,
    getAffiliateUrl,
    getByRetailer,
    getByCategory,
    reload: loadAffiliateLinks
  };
}
