import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Heart, ShoppingCart, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileNav from '@/components/MobileNav';
import ProfileMenu from '@/components/ProfileMenu';
import ProfileSheet from '@/components/ProfileSheet';
import { useProducts } from '@/hooks/useProducts';

export default function Shop() {
  const navigate = useNavigate();
  const { products: allProducts, loading: productsLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profileOpen, setProfileOpen] = useState(false);

  // Filter products based on search and category
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      product.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      product.gender?.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by filteredProducts
  };

  const handleAddToCloset = async (product: any) => {
    // TODO: Implement add to closet functionality
    toast({
      title: 'Added to Closet!',
      description: `${product.name} has been added to your wardrobe.`
    });
  };

  const handleBuyNow = (product: any) => {
    // Open affiliate link in new tab
    window.open(product.affiliate_link, '_blank');

    // Track affiliate click
    // TODO: Implement analytics tracking
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Shop Fashion</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate('/favorites')}>
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('/cart')}>
                <ShoppingCart className="w-5 h-5" />
              </Button>
              <ProfileMenu onProfileClick={() => setProfileOpen(true)} />
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for clothing, shoes, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="women">Women</TabsTrigger>
            <TabsTrigger value="men">Men</TabsTrigger>
            <TabsTrigger value="dresses">Dresses</TabsTrigger>
            <TabsTrigger value="tops">Tops</TabsTrigger>
            <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
            <TabsTrigger value="shoes">Shoes</TabsTrigger>
            <TabsTrigger value="accessories">Accessories</TabsTrigger>
            <TabsTrigger value="jewelry">Jewelry</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <Select
            value={filters.sortBy || 'relevance'}
            onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.brand || 'all'}
            onValueChange={(value) => setFilters({ ...filters, brand: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="zara">Zara</SelectItem>
              <SelectItem value="hm">H&M</SelectItem>
              <SelectItem value="nike">Nike</SelectItem>
              <SelectItem value="adidas">Adidas</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100 relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleAddToCloset(product)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{product.brand || 'Brand'}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">{product.currency} {product.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{product.retailer}</p>
                  <p className="text-xs text-gray-400 mt-1">{product.category}</p>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleBuyNow(product)}
                  >
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddToCloset(product)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Profile Sheet */}
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
