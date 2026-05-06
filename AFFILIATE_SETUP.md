# Affiliate API Setup Guide

## Shopify Collabs Integration (Recommended for Fashion)

### Quick Start
1. Sign up for Shopify Collabs: https://www.shopify.com/collabs
2. Create your creator profile
3. Apply to fashion brands
4. Get your affiliate ID from your dashboard
5. Add to `.env`:
   ```
   VITE_SHOPIFY_AFFILIATE_ID=your-affiliate-id
   ```

### Current Implementation Status
✅ **Affiliate link generation** - Ready to use
⚠️ **Product search** - Requires manual curation or brand-specific integration

### Why Shopify Collabs?
- **Higher commissions**: 10-30% vs Amazon's 1-10%
- **Fashion-focused**: Most premium fashion brands use Shopify
- **Better cookie duration**: 30-45 days vs Amazon's 24 hours
- **No sales requirement**: Unlike Amazon's 3-sale rule
- **Direct brand relationships**: Better terms and exclusive deals

### How It Works

**Brand Approval:**
1. Browse brands in Shopify Collabs marketplace
2. Apply to brands that fit your audience
3. Brands approve/reject applications
4. Get unique affiliate parameters per brand

**Link Generation:**
```typescript
import { ShopifyCollabsAPI } from './integrations/shopping-api';

const shopify = new ShopifyCollabsAPI('your-affiliate-id');

// Create affiliate link
const link = shopify.createAffiliateLink(
  'https://brandname.com',
  '/products/product-handle'
);
// Returns: https://brandname.com/products/product-handle?ref=your-affiliate-id

// With discount code
const discountLink = shopify.createAffiliateCodeLink(
  'https://brandname.com',
  '/products/product-handle',
  'SABLE10'
);
```

### Implementation Options

**Option 1: Manual Curation (Easiest)**
- Curate a list of products from approved brands
- Store product details in your database
- Generate affiliate links dynamically

**Option 2: Shopify Storefront API (Advanced)**
- Use Storefront API for each approved brand
- Requires API credentials from each brand
- Enables real-time product data

**Option 3: Hybrid Approach (Recommended)**
- Start with curated collections
- Add Storefront API as you grow relationships
- Best balance of effort and functionality

## Amazon Associates Integration

### Quick Start (Browser-Only)
1. Sign up for Amazon Associates: https://affiliate-program.amazon.com/
2. Get your Associate Tag (looks like `yourstore-20`)
3. Add to `.env`:
   ```
   VITE_AMAZON_ASSOCIATE_TAG=yourstore-20
   ```

### Current Implementation Status
✅ **Affiliate link generation** - Ready to use
⚠️ **Product search** - Requires backend implementation

### Why Backend is Needed
Amazon Product Advertising API (PA-API 5.0) requires:
- HMAC-SHA256 request signing
- Secret keys that shouldn't be exposed in browser
- Complex authentication flow

### Option 1: Full PA-API Integration (Recommended)

**Backend Setup Required:**

1. **Get PA-API Credentials:**
   - Sign up at https://affiliate-program.amazon.com/
   - Request PA-API access (requires 3 qualified sales in 180 days)
   - Get Access Key, Secret Key, and Associate Tag

2. **Create Backend Endpoint:**
   ```typescript
   // backend/api/amazon-search.ts
   import { ProductAdvertisingAPIv1 } from 'paapi5-nodejs-sdk';

   export async function searchAmazon(query: string) {
     const client = new ProductAdvertisingAPIv1({
       accessKey: process.env.AMAZON_ACCESS_KEY,
       secretKey: process.env.AMAZON_SECRET_KEY,
       region: 'us-east-1',
       partnerTag: process.env.AMAZON_ASSOCIATE_TAG
     });

     // Search implementation...
   }
   ```

3. **Update Frontend:**
   ```typescript
   // In shopping-api.ts AmazonAPI class
   async searchProducts(query: string) {
     const response = await fetch('/api/amazon-search', {
       method: 'POST',
       body: JSON.stringify({ query })
     });
     return response.json();
   }
   ```

### Option 2: Direct Affiliate Links (Current)

**Works Now - No Backend Needed:**

```typescript
import { AmazonAPI } from './integrations/shopping-api';

const amazon = new AmazonAPI('yourstore-20');

// Create affiliate link for any Amazon product
const link = amazon.createAffiliateLink('B08N5WRWNW'); // ASIN
// Returns: https://www.amazon.com/dp/B08N5WRWNW?tag=yourstore-20

// Use in your app
<a href={link}>Buy on Amazon</a>
```

### Option 3: Hybrid Approach (Recommended for MVP)

1. Use mock data for product search (current implementation)
2. Manually curate Amazon ASINs for your products
3. Generate affiliate links automatically

```typescript
// In your product database
const curatedProducts = [
  {
    id: '1',
    name: 'Classic White T-Shirt',
    asin: 'B08N5WRWNW',
    price: 29.99
  }
];

// Generate affiliate links on the fly
const amazonAPI = new AmazonAPI('yourstore-20');
const productWithLink = {
  ...product,
  affiliateUrl: amazonAPI.createAffiliateLink(product.asin)
};
```

## Affiliate Priority Order

The app tries affiliate networks in this order:
1. **Shopify Collabs** (10-30% commission, best for fashion)
2. **Amazon Associates** (1-10% commission, widest catalog)
3. **ShopStyle** (discontinued - fallback only)
4. **Mock Data** (development fallback)

## Other Affiliate Programs

### Already Integrated:
- ✅ Shopify Collabs (affiliate links ready, manual curation)
- ✅ Amazon (affiliate links ready, search needs backend)
- ✅ ShopStyle (discontinued - keeping for reference)

### To Add:
- Rakuten Advertising
- ShareASale
- CJ Affiliate
- rewardStyle/LTK

## Next Steps

1. **Immediate:** Sign up for Shopify Collabs (highest priority)
2. **Week 1:**
   - Add Shopify affiliate ID to `.env`
   - Apply to 5-10 fashion brands
3. **Week 2:**
   - Amazon already configured ✅
   - Focus on getting brand approvals
4. **Week 3:**
   - Curate product collections from approved brands
   - Build backend proxy for Amazon PA-API (optional)

## Commission Rates

| Network | Rate | Cookie Duration | Payment Terms |
|---------|------|----------------|---------------|
| Shopify Collabs | 10-30% | 30-45 days | Varies by brand |
| Amazon Associates | 1-10% | 24 hours | Net-60 |
| Rakuten | 5-15% | 30 days | Net-30 |
| ShareASale | 5-20% | 30-90 days | Net-30 |
| CJ Affiliate | 5-12% | 7-45 days | Net-45 |
| rewardStyle/LTK | 10-25% | 30 days | Net-30 |

## Resources

- Amazon PA-API Docs: https://webservices.amazon.com/paapi5/documentation/
- Amazon Associates: https://affiliate-program.amazon.com/
- PA-API Node SDK: https://www.npmjs.com/package/paapi5-nodejs-sdk
