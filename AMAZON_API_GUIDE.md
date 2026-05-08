# Amazon API Guide - Which One to Use?

## API Comparison

### ❌ SP-API (Selling Partner API)
**Link:** https://developer-docs.amazon.com/sp-api
**For:** Sellers managing their own inventory on Amazon
**Use cases:**
- Managing product listings
- Processing orders
- Tracking inventory
- Fulfillment by Amazon (FBA)

**Not for you** - This is for people selling products ON Amazon.

---

### ✅ PA-API (Product Advertising API)
**Link:** https://webservices.amazon.com/paapi5/documentation/
**For:** Amazon Associates (affiliates) promoting products
**Use cases:**
- Search Amazon products
- Get product details
- Generate affiliate links
- Display products in your app

**This is what you need!** - Perfect for your fashion app.

---

## How to Get PA-API Access

### Step 1: Become an Amazon Associate

1. Go to [Amazon Associates](https://affiliate-program.amazon.com/)
2. Sign up / Login
3. Complete your profile
4. Add your website/app details
5. **Get approved** (usually takes 24-48 hours)

### Step 2: Request PA-API Access

1. Once approved as an Associate
2. Go to **Tools** → **Product Advertising API**
3. Click **Request Access**
4. Fill out the form (describe your app)
5. Wait for approval (1-2 days)

### Step 3: Get Your Credentials

Once approved, you'll get:
- **Access Key ID** (like AWS_ACCESS_KEY)
- **Secret Access Key** (like AWS_SECRET_KEY)
- **Partner Tag** (your tracking ID, like: yourname-20)

---

## Setting Up PA-API in Your App

### 1. Add Secrets to Supabase

```bash
# Supabase Dashboard → Settings → Edge Functions → Secrets

AMAZON_ACCESS_KEY=AKIA...
AMAZON_SECRET_KEY=wJalr...
AMAZON_PARTNER_TAG=yourname-20
```

### 2. Deploy Edge Function

```bash
cd /path/to/your/project
supabase functions deploy amazon-paapi
```

### 3. Test It

```typescript
const { data } = await supabase.functions.invoke('amazon-paapi', {
  body: {
    category: "Women's Tops",
    keywords: "blouse",
    gender: "women"
  }
})

console.log('Found products:', data.products)
```

---

## PA-API Features You Can Use

### 1. Search Products
```javascript
{
  Keywords: "women's blazer",
  SearchIndex: "Fashion",
  ItemCount: 10
}
```

### 2. Get Product Details
```javascript
{
  ItemIds: ["B08X12345"],
  Resources: [
    "Images.Primary.Large",
    "ItemInfo.Title",
    "Offers.Listings.Price"
  ]
}
```

### 3. Get Variations (sizes, colors)
```javascript
{
  ASIN: "B08X12345",
  Resources: [
    "VariationSummary.VariationDimension",
    "VariationSummary.PageNumber"
  ]
}
```

---

## Rate Limits

**Free Tier:**
- 8,640 requests/day (1 request every 10 seconds)
- 1 request per second

**Paid Tier:**
- Higher limits based on sales

**Tip:** Cache products in Supabase to reduce API calls by 90%+

---

## Alternative: Keep Using CSV

If you don't want to set up PA-API yet:

1. **Keep current CSV approach** (works fine!)
2. **Manually curate** best products
3. **Update quarterly** with new products
4. **Add PA-API later** when you have more users

---

## Benefits of PA-API vs CSV

| Feature | CSV | PA-API |
|---------|-----|--------|
| **Product data** | Manual | Automatic |
| **Prices** | Outdated | Real-time |
| **Availability** | Unknown | Current |
| **Images** | Manual | High-quality |
| **Effort** | High | Low |
| **Cost** | Free | Free (for affiliates) |

---

## Quick Start Checklist

- [ ] Become Amazon Associate
- [ ] Get approved
- [ ] Request PA-API access
- [ ] Get credentials (Access Key, Secret, Partner Tag)
- [ ] Add to Supabase secrets
- [ ] Deploy edge function
- [ ] Test product search
- [ ] Update OutfitRecommendations to use PA-API
- [ ] Enable caching

---

## If You Can't Get PA-API Access

**Alternatives:**

1. **Keep CSV** - Works perfectly fine!
2. **Amazon OneLink** - Simpler affiliate links (no API needed)
3. **Manual curation** - Handpick best products
4. **Wait for approval** - Usually approved within days

---

## Current Status

✅ **You have:** CSV with affiliate links (working!)
⏳ **You can add:** PA-API for dynamic products
📊 **Priority:** Get more users first, API can wait!

---

## My Recommendation

**For now:** Keep using your CSV approach - it works!

**Later:** Add PA-API when you have:
- More daily users
- Need for real-time prices
- Want automated product updates

**Don't block your launch** waiting for PA-API approval. Ship with CSV, add API later! 🚀
