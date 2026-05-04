// Shopping API Integration
// Integrates with multiple fashion/shopping APIs and affiliate programs

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

// Shopping API Manager
export class ShoppingAPIManager {
  private shopStyleAPI?: ShopStyleAPI;
  private mockAPI: MockShoppingAPI;

  constructor() {
    this.mockAPI = new MockShoppingAPI();

    // Initialize ShopStyle API if key is available
    const shopStyleKey = import.meta.env.VITE_SHOPSTYLE_API_KEY;
    if (shopStyleKey) {
      this.shopStyleAPI = new ShopStyleAPI(shopStyleKey);
    }
  }

  async searchProducts(query: string, filters: SearchFilters = {}, limit = 50): Promise<Product[]> {
    // Try ShopStyle API first, fall back to mock
    if (this.shopStyleAPI) {
      try {
        const products = await this.shopStyleAPI.searchProducts(query, filters, limit);
        if (products.length > 0) return products;
      } catch (error) {
        console.warn('ShopStyle API failed, falling back to mock data');
      }
    }

    return this.mockAPI.searchProducts(query, filters, limit);
  }

  async getTrendingProducts(category?: string, limit = 20): Promise<Product[]> {
    if (this.shopStyleAPI) {
      try {
        const products = await this.shopStyleAPI.getTrendingProducts(category, limit);
        if (products.length > 0) return products;
      } catch (error) {
        console.warn('ShopStyle API failed, falling back to mock data');
      }
    }

    return this.mockAPI.getTrendingProducts(category, limit);
  }
}

// Export singleton instance
export const shoppingAPI = new ShoppingAPIManager();
