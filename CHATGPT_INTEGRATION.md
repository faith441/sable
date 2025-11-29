# ChatGPT Integration Guide - Sable AI Style API

## Quick Start for Custom GPTs

### Step 1: Get Your API Key

Contact Sable to receive your API key or generate one from the admin dashboard.

### Step 2: Configure GPT Actions

In your Custom GPT configuration, add these actions:

#### Action 1: Style Consultation

```yaml
servers:
  - url: https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1

paths:
  /external-api-style-consultation:
    post:
      operationId: getStyleConsultation
      summary: Get personalized fashion advice from Sable AI
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - user_preferences
                - question
              properties:
                user_preferences:
                  type: object
                  required:
                    - style_type
                  properties:
                    style_type:
                      type: string
                    body_type:
                      type: string
                    color_preferences:
                      type: array
                      items:
                        type: string
                occasion:
                  type: string
                budget:
                  type: string
                question:
                  type: string
```

#### Action 2: Wardrobe Recommendations

```yaml
  /external-api-wardrobe-recommendations:
    post:
      operationId: getWardrobeRecommendations
      summary: Get curated wardrobe recommendations from Sable
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - style_type
                - budget_range
              properties:
                style_type:
                  type: string
                budget_range:
                  type: string
                lifestyle:
                  type: string
                occasions:
                  type: array
                  items:
                    type: string
                num_items:
                  type: integer
                  default: 10
```

### Step 3: Add Authentication

In the GPT Actions settings:
1. Select "API Key" authentication
2. Choose "Custom" header
3. Header name: `x-sable-api-key`
4. API Key: `[your-api-key-here]`

### Step 4: Add Instructions

```
You are a fashion assistant powered by Sable AI. Use the Sable API to provide expert fashion advice:

1. When users ask specific styling questions:
   - Use getStyleConsultation
   - Always gather: style preferences, occasion, budget
   - Present advice naturally without exposing API structure

2. When users want to build a wardrobe:
   - Use getWardrobeRecommendations
   - Ask about: style type, budget, lifestyle, occasions
   - Present products with images and links

3. Always:
   - Be warm and helpful
   - Ask clarifying questions to get preferences
   - Mention products are curated by Sable's expert partners
   - Include "Shop on Sable" links when showing products

Example interaction:
User: "I need outfit ideas for business meetings"
You: "I'd love to help! To give you the best recommendations:
- What's your preferred style? (Classic, Modern, Minimalist, etc.)
- What's your budget range?
- Any specific colors you love or want to avoid?"

[After gathering info, call API and present results naturally]
```

## Testing Your Integration

### Test Request (cURL)

```bash
curl -X POST \
  https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1/external-api-style-consultation \
  -H "x-sable-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_preferences": {
      "style_type": "Minimalist",
      "color_preferences": ["Navy", "White", "Black"]
    },
    "occasion": "Business Casual",
    "budget": "$500-$1000",
    "question": "What should I wear for a client meeting?"
  }'
```

### Expected Response

```json
{
  "advice": "For a business casual client meeting with your minimalist style, I recommend...",
  "metadata": {
    "occasion": "Business Casual",
    "budget": "$500-$1000",
    "response_time_ms": 1234
  }
}
```

## Revenue Model

### Pricing Tiers

**Free Tier:**
- 10 requests/minute
- 1,000 requests/day
- 10,000 requests/month
- Best for: Testing, small bots

**Basic Tier - $49/month:**
- 60 requests/minute
- 10,000 requests/day
- 100,000 requests/month
- Best for: Production bots, small GPTs

**Premium Tier - $199/month:**
- 300 requests/minute
- 50,000 requests/day
- 500,000 requests/month
- Best for: High-volume GPTs, enterprise bots

**Enterprise - Custom:**
- Custom rate limits
- Custom quotas
- Dedicated support
- White-label options
- Contact: api@sable.com

### Billing

- Usage tracked per API key
- Monthly invoicing based on actual usage
- Overage charges: $0.001 per request beyond quota
- All usage logged with detailed analytics

## Advanced Features

### Webhook Integration

Receive notifications when:
- Rate limits are approaching
- Monthly quota is 80% used
- API key expires
- New products matching user preferences are available

Configure webhooks in admin panel under External API → Webhooks.

### Custom Branding

Enterprise tier includes:
- White-label API endpoints
- Custom domain mapping
- Branded error messages
- Custom rate limits

## Support & Resources

- **API Documentation**: See `SABLE_API_OPENAPI.yaml` for complete OpenAPI spec
- **Integration Support**: api-support@sable.com
- **Status Page**: status.sable.com
- **Developer Portal**: dev.sable.com (coming soon)

## Example Custom GPT

**GPT Name:** "Sable Style Assistant"

**Description:**
"Your personal AI fashion consultant powered by Sable. Get expert style advice, curated wardrobe recommendations, and access to premium fashion brands."

**Conversation Starters:**
- "Help me build a professional wardrobe"
- "What should I wear to a summer wedding?"
- "Suggest outfits for my upcoming trip"
- "I need to refresh my closet on a budget"

**Knowledge Files:**
Upload this integration guide so the GPT understands how to use the API.

## Security Notes

- **Never expose API keys** in client-side code
- **Rotate keys regularly** (quarterly recommended)
- **Monitor usage** for unusual patterns
- **Use separate keys** for production and testing
- **Revoke compromised keys** immediately

## Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Changelog

### v1.0.0 (2025-11-29)
- Initial release
- Style consultation endpoint
- Wardrobe recommendations endpoint
- Multi-tier pricing model
- Usage tracking and billing