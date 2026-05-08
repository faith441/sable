// Shopping API Integration
// Integrates with multiple fashion/shopping APIs and affiliate programs
import { supabase } from './supabase/client';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  images?: string[];
  description?: string;
  category: string;
  url: string;
  affiliateUrl?: string;
  retailer: string;
  inStock: boolean;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  reviewCount?: number;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  size?: string;
  color?: string;
  gender?: 'men' | 'women' | 'unisex';
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest';
}

// Amazon Product Advertising API Integration
export class AmazonAPI {
  private associateTag: string;
  private baseUrl = 'https://www.amazon.com';

  constructor(associateTag: string) {
    this.associateTag = associateTag;
  }

  async searchProducts(query: string, filters: SearchFilters = {}, limit = 50): Promise<Product[]> {
    // For Amazon Product Advertising API, you'd typically use a backend proxy
    // This is a simplified version for demonstration
    // In production, implement PA-API 5.0 with proper authentication on backend

    try {
      // Sample implementation - in production, call your backend API
      // that interfaces with Amazon PA-API 5.0
      const categoryMap: Record<string, string> = {
        'tops': 'Fashion',
        'bottoms': 'Fashion',
        'dresses': 'Fashion',
        'shoes': 'Shoes',
        'accessories': 'Jewelry'
      };

      const searchIndex = categoryMap[filters.category || ''] || 'Fashion';

      // Return empty for now - implement backend proxy for PA-API
      console.log(`Amazon search: ${query} in ${searchIndex}`);
      return [];

    } catch (error) {
      console.error('Amazon API error:', error);
      return [];
    }
  }

  async getTrendingProducts(category?: string, limit = 20): Promise<Product[]> {
    return this.searchProducts('trending fashion', { category }, limit);
  }

  // Helper to create Amazon affiliate links
  createAffiliateLink(asin: string): string {
    return `${this.baseUrl}/dp/${asin}?tag=${this.associateTag}`;
  }

  private transformProduct(item: any): Product {
    return {
      id: item.ASIN || '',
      name: item.ItemInfo?.Title?.DisplayValue || '',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
      price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
      originalPrice: item.Offers?.Listings?.[0]?.SavingBasis?.Amount,
      currency: item.Offers?.Listings?.[0]?.Price?.Currency || 'USD',
      image: item.Images?.Primary?.Large?.URL || '',
      images: item.Images?.Variants?.map((img: any) => img.Large?.URL) || [],
      description: item.ItemInfo?.Features?.DisplayValues?.join('. ') || '',
      category: item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue || '',
      url: this.createAffiliateLink(item.ASIN),
      affiliateUrl: this.createAffiliateLink(item.ASIN),
      retailer: 'Amazon',
      inStock: item.Offers?.Listings?.[0]?.Availability?.Type === 'Now',
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count
    };
  }
}

// Shopify Collabs API Integration
export class ShopifyCollabsAPI {
  private affiliateId: string;

  constructor(affiliateId: string) {
    this.affiliateId = affiliateId;
  }

  async searchProducts(query: string, filters: SearchFilters = {}, limit = 50): Promise<Product[]> {
    // Shopify Collabs doesn't have a public search API
    // In production, you would:
    // 1. Manually curate Shopify store products
    // 2. Use Shopify Storefront API for each approved brand
    // 3. Generate affiliate links on the fly

    console.log(`Shopify Collabs search: ${query}`);
    return [];
  }

  async getTrendingProducts(category?: string, limit = 20): Promise<Product[]> {
    return this.searchProducts('trending', { category }, limit);
  }

  // Helper to create Shopify affiliate links
  createAffiliateLink(brandUrl: string, productPath: string): string {
    const url = new URL(productPath, brandUrl);
    url.searchParams.set('ref', this.affiliateId);
    return url.toString();
  }

  // Alternative format for some Shopify affiliate programs
  createAffiliateCodeLink(brandUrl: string, productPath: string, discountCode?: string): string {
    const url = new URL(productPath, brandUrl);
    if (discountCode) {
      url.searchParams.set('discount', discountCode);
    }
    url.searchParams.set('ref', this.affiliateId);
    return url.toString();
  }

  private transformProduct(item: any, brandUrl: string): Product {
    return {
      id: item.id?.toString() || '',
      name: item.title || '',
      brand: item.vendor || '',
      price: item.variants?.[0]?.price ? parseFloat(item.variants[0].price) : 0,
      originalPrice: item.variants?.[0]?.compare_at_price
        ? parseFloat(item.variants[0].compare_at_price)
        : undefined,
      currency: 'USD',
      image: item.images?.[0]?.src || '',
      images: item.images?.map((img: any) => img.src) || [],
      description: item.body_html || '',
      category: item.product_type || '',
      url: this.createAffiliateLink(brandUrl, `/products/${item.handle}`),
      affiliateUrl: this.createAffiliateLink(brandUrl, `/products/${item.handle}`),
      retailer: brandUrl.replace('https://', '').replace('www.', '').split('.')[0],
      inStock: item.variants?.some((v: any) => v.available) || false,
      sizes: item.variants?.map((v: any) => v.option1).filter(Boolean) || [],
      colors: item.variants?.map((v: any) => v.option2).filter(Boolean) || []
    };
  }
}

// ShopStyle API Integration
export class ShopStyleAPI {
  private apiKey: string;
  private baseUrl = 'https://api.shopstyle.com/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchProducts(query: string, filters: SearchFilters = {}, limit = 50): Promise<Product[]> {
    const params = new URLSearchParams({
      pid: this.apiKey,
      fts: query,
      limit: limit.toString(),
      ...(filters.category && { cat: filters.category }),
      ...(filters.minPrice && { priceMin: filters.minPrice.toString() }),
      ...(filters.maxPrice && { priceMax: filters.maxPrice.toString() }),
      ...(filters.brand && { fl: `b{${filters.brand}}` }),
      ...(filters.sortBy && { sort: this.mapSortBy(filters.sortBy) })
    });

    try {
      const response = await fetch(`${this.baseUrl}/products?${params}`);
      const data = await response.json();

      return data.products?.map((item: any) => this.transformProduct(item)) || [];
    } catch (error) {
      console.error('ShopStyle API error:', error);
      return [];
    }
  }

  async getTrendingProducts(category?: string, limit = 20): Promise<Product[]> {
    const params = new URLSearchParams({
      pid: this.apiKey,
      limit: limit.toString(),
      ...(category && { cat: category })
    });

    try {
      const response = await fetch(`${this.baseUrl}/products?${params}`);
      const data = await response.json();

      return data.products?.map((item: any) => this.transformProduct(item)) || [];
    } catch (error) {
      console.error('ShopStyle API error:', error);
      return [];
    }
  }

  private transformProduct(item: any): Product {
    return {
      id: item.id?.toString() || '',
      name: item.name || item.productname || '',
      brand: item.brand?.name || item.brandedName || '',
      price: parseFloat(item.price || item.salePrice || '0'),
      originalPrice: item.retailPrice ? parseFloat(item.retailPrice) : undefined,
      currency: item.currency || 'USD',
      image: item.image?.sizes?.Large?.url || item.image?.url || '',
      images: item.images?.map((img: any) => img.sizes?.Large?.url || img.url) || [],
      description: item.description || '',
      category: item.categories?.[0]?.name || '',
      url: item.clickUrl || item.url || '',
      affiliateUrl: item.clickUrl || '',
      retailer: item.retailer?.name || '',
      inStock: item.inStock !== false,
      sizes: item.sizes || [],
      colors: item.colors || []
    };
  }

  private mapSortBy(sortBy: string): string {
    const sortMap: Record<string, string> = {
      'relevance': 'Popular',
      'price-asc': 'PriceLowToHigh',
      'price-desc': 'PriceHighToLow',
      'newest': 'Recency'
    };
    return sortMap[sortBy] || 'Popular';
  }
}

// Mock API for development (returns sample data)
export class MockShoppingAPI {
  async searchProducts(query: string, filters: SearchFilters = {}, limit = 50): Promise<Product[]> {
    // Generate mock products
    const categories = ['tops', 'bottoms', 'dresses', 'shoes', 'accessories'];
    const brands = ['Zara', 'H&M', 'Nike', 'Adidas', 'Mango', 'Uniqlo'];
    const retailers = ['Nordstrom', 'ASOS', 'Zalando', 'Amazon Fashion'];

    const products: Product[] = [];

    for (let i = 0; i < Math.min(limit, 20); i++) {
      products.push({
        id: `mock-${i}`,
        name: `${query} Item ${i + 1}`,
        brand: brands[Math.floor(Math.random() * brands.length)],
        price: Math.floor(Math.random() * 150) + 20,
        currency: 'USD',
        image: `https://source.unsplash.com/400x600/?fashion,${query}&sig=${i}`,
        category: filters.category || categories[Math.floor(Math.random() * categories.length)],
        url: 'https://example.com/product',
        affiliateUrl: 'https://example.com/product?ref=sable',
        retailer: retailers[Math.floor(Math.random() * retailers.length)],
        inStock: Math.random() > 0.1,
        rating: Math.random() * 2 + 3,
        reviewCount: Math.floor(Math.random() * 500) + 10
      });
    }

    return products;
  }

  async getTrendingProducts(category?: string, limit = 20): Promise<Product[]> {
    return this.searchProducts('trending', { category }, limit);
  }
}

// Shopping API Manager - Now uses Supabase Edge Function for real API aggregation
export class ShoppingAPIManager {
  private mockAPI: MockShoppingAPI;

  constructor() {
    this.mockAPI = new MockShoppingAPI();
  }

  async searchProducts(query: string, filters: SearchFilters = {}, limit = 50): Promise<Product[]> {
    try {
      // Call the aggregate-products Edge Function
      const { data, error } = await supabase.functions.invoke('aggregate-products', {
        body: {
          query: query,
          category: filters.category,
          gender: filters.gender,
          priceRange: filters.minPrice && filters.maxPrice ? {
            min: filters.minPrice,
            max: filters.maxPrice
          } : undefined,
          limit: limit
        }
      });

      if (error) {
        console.error('Aggregate products error:', error);
        return this.mockAPI.searchProducts(query, filters, limit);
      }

      if (!data || !data.products || data.products.length === 0) {
        console.warn('No products returned from aggregate-products, using mock data');
        return this.mockAPI.searchProducts(query, filters, limit);
      }

      // Transform the response to match our Product interface
      return data.products.map((item: any) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        originalPrice: item.originalPrice,
        currency: item.currency || 'USD',
        image: item.image_url,
        images: [item.image_url],
        description: item.description,
        category: item.category,
        url: item.product_url,
        affiliateUrl: item.affiliate_url || item.product_url,
        retailer: item.source,
        inStock: item.inStock !== false,
        sizes: item.sizes || [],
        colors: item.colors || [],
        rating: item.rating,
        reviewCount: item.reviewCount
      }));
    } catch (error) {
      console.error('Shopping API error:', error);
      return this.mockAPI.searchProducts(query, filters, limit);
    }
  }

  async getTrendingProducts(category?: string, limit = 20): Promise<Product[]> {
    // For trending, we'll search for general fashion terms based on category
    const trendingQueries: Record<string, string> = {
      'women': 'women fashion',
      'men': 'men fashion',
      'dresses': 'dresses',
      'tops': 'tops shirts',
      'bottoms': 'pants jeans',
      'shoes': 'shoes sneakers',
      'accessories': 'accessories bags',
      'jewelry': 'jewelry necklace earrings'
    };

    const query = category ? trendingQueries[category] || 'fashion' : 'trending fashion';
    return this.searchProducts(query, { category }, limit);
  }

  /**
   * Enhance products with affiliate links from CSV
   * Call this after loading products to inject affiliate URLs
   */
  enhanceWithAffiliateLinks(products: Product[], affiliateLinks: any[]): Product[] {
    return products.map(product => {
      // Try to find matching affiliate link by category or retailer
      const matchingLink = affiliateLinks.find(link =>
        link.category.toLowerCase().includes(product.category?.toLowerCase() || '') ||
        link.retailer.toLowerCase() === product.retailer?.toLowerCase()
      );

      if (matchingLink) {
        return {
          ...product,
          affiliateUrl: matchingLink.affiliateLink
        };
      }

      return product;
    });
  }
}

// Export singleton instance
export const shoppingAPI = new ShoppingAPIManager();
