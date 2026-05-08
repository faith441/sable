# Affiliate Links Management Guide

## Overview
This guide explains how to manage and use affiliate links in your fashion app.

## Files
- **CSV File**: `/public/affiliate_links.csv` - Stores all affiliate links
- **Loader**: `/src/utils/affiliateLoader.ts` - Loads and manages affiliate links
- **Hook**: `/src/hooks/useAffiliateLinks.ts` - React hook for using affiliate links
- **Example**: `/src/components/AffiliateLinksExample.tsx` - Example usage

## CSV Format

```csv
id,retailer,affiliate_link,product_name,category,date_added,notes
1,Amazon,https://amzn.to/42kh8Gw,Product Name,Fashion,2026-05-07,Optional notes
```

### Columns:
- **id**: Unique identifier (increment for each new link)
- **retailer**: Store name (Amazon, Nordstrom, etc.)
- **affiliate_link**: The affiliate URL
- **product_name**: Name of the product
- **category**: Product category (Fashion, Shoes, Accessories, etc.)
- **date_added**: Date added (YYYY-MM-DD)
- **notes**: Optional notes about the product

## Adding New Affiliate Links

### Method 1: Edit CSV Directly

1. Open `/public/affiliate_links.csv`
2. Add a new line with your affiliate link:
```csv
3,Amazon,https://amzn.to/XXXXX,Designer Blazer,Outerwear,2026-05-07,Navy blue blazer
```

### Method 2: Use Script

```bash
# Add the CSV file back to git
git add public/affiliate_links.csv
git commit -m "Add new affiliate links"
```

## Using in Your App

### Basic Usage

```tsx
import { useAffiliateLinks } from './hooks/useAffiliateLinks';

function MyComponent() {
  const { links, loading } = useAffiliateLinks();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {links.map(link => (
        <a key={link.id} href={link.affiliateLink}>
          {link.productName}
        </a>
      ))}
    </div>
  );
}
```

### Filter by Retailer

```tsx
const { getByRetailer } = useAffiliateLinks();
const amazonLinks = getByRetailer('Amazon');
```

### Filter by Category

```tsx
const { getByCategory } = useAffiliateLinks();
const fashionLinks = getByCategory('Fashion');
```

## Integration with Shopping API

To integrate affiliate links with product recommendations:

```tsx
import { useAffiliateLinks } from './hooks/useAffiliateLinks';
import { shoppingAPI } from './integrations/shopping-api';

function ProductWithAffiliateLink({ product }) {
  const { getAffiliateUrl } = useAffiliateLinks();

  // Convert regular product URL to affiliate URL
  const affiliateUrl = getAffiliateUrl(product.url, product.retailer);

  return (
    <a href={affiliateUrl} target="_blank" rel="noopener noreferrer">
      {product.name} - Buy Now
    </a>
  );
}
```

## Adding Product Details

For the existing links, visit each Amazon URL and update the CSV:

1. Click on `https://amzn.to/42kh8Gw` - See what product it is
2. Update the CSV with actual product name and category
3. Repeat for all links

Example update:
```csv
1,Amazon,https://amzn.to/42kh8Gw,Calvin Klein Slim Fit Suit,Men's Suits,2026-05-07,Black slim fit
2,Amazon,https://amzn.to/48L4P9E,Nike Air Max Sneakers,Men's Shoes,2026-05-07,Size 9-13 available
```

## Common Categories

Suggested categories for fashion items:
- `Men's Suits`
- `Women's Dresses`
- `Men's Shoes`
- `Women's Shoes`
- `Accessories`
- `Outerwear`
- `Casual Wear`
- `Athletic Wear`
- `Jewelry`
- `Bags`

## Testing

1. Start your dev server: `npm run dev`
2. Import and use the example component:
   ```tsx
   import { AffiliateLinksExample } from './components/AffiliateLinksExample';
   ```
3. Check browser console for any errors loading the CSV

## Next Steps

1. **Update product details** in CSV with actual product names
2. **Add more affiliate links** from different retailers
3. **Integrate with outfit recommendations** to show affiliate links for suggested products
4. **Track clicks** (optional) - Add analytics to track which affiliate links get clicks
