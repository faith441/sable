# Sable AI Style API - LLM Integration Guide

## Overview

The Sable API allows AI assistants like ChatGPT, Claude, and other LLMs to provide personalized fashion advice and wardrobe recommendations to users. This integration maintains Sable's control over data and revenue while extending the service through AI platforms.

## Base URL

```
https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1
```

## Authentication

All requests require an API key in the `x-sable-api-key` header:

```bash
curl -H "x-sable-api-key: YOUR_API_KEY" \
     https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1/external-api-style-consultation
```

## Available Tiers

| Tier | Rate Limit (per minute) | Daily Limit | Monthly Quota | Cost |
|------|------------------------|-------------|---------------|------|
| Free | 10 | 1,000 | 10,000 | $0 |
| Basic | 60 | 10,000 | 100,000 | $49/month |
| Premium | 300 | 50,000 | 500,000 | $199/month |
| Enterprise | Custom | Custom | Custom | Contact Sales |

## Endpoints

### 1. Style Consultation

Get personalized fashion advice based on user preferences.

**Endpoint:** `POST /external-api-style-consultation`

**Request Body:**
```json
{
  "user_preferences": {
    "style_type": "Minimalist",
    "body_type": "Athletic",
    "color_preferences": ["Navy", "White", "Black"],
    "sizes": {
      "top": "M",
      "bottom": "32x30",
      "shoe": "10"
    }
  },
  "occasion": "Business Casual",
  "budget": "$500-$1000",
  "question": "What should I wear for a client presentation?"
}
```

**Response:**
```json
{
  "advice": "For a business casual client presentation with your minimalist style...",
  "metadata": {
    "occasion": "Business Casual",
    "budget": "$500-$1000",
    "response_time_ms": 1245
  }
}
```

### 2. Wardrobe Recommendations

Get curated wardrobe recommendations matching user criteria.

**Endpoint:** `POST /external-api-wardrobe-recommendations`

**Request Body:**
```json
{
  "style_type": "Classic",
  "budget_range": "$1000-$2000",
  "lifestyle": "Professional",
  "occasions": ["Work", "Weekend", "Formal"],
  "num_items": 15
}
```

**Response:**
```json
{
  "wardrobe": {
    "items": [
      {
        "id": "uuid",
        "name": "Premium Cotton Oxford Shirt",
        "brand": "Brooks Brothers",
        "price": 89.50,
        "category": "Tops",
        "image_url": "https://...",
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["White", "Blue", "Pink"]
      }
    ],
    "total_items": 15,
    "curation_notes": "This capsule wardrobe focuses on versatile classics...",
    "style_type": "Classic",
    "budget_range": "$1000-$2000"
  },
  "metadata": {
    "response_time_ms": 2341
  }
}
```

## ChatGPT Integration

### Function Calling Schema

Add these function definitions to your ChatGPT custom GPT or API integration:

```json
{
  "name": "get_style_consultation",
  "description": "Get personalized fashion and style advice from Sable's AI stylist based on user preferences, occasion, and budget.",
  "parameters": {
    "type": "object",
    "properties": {
      "user_preferences": {
        "type": "object",
        "properties": {
          "style_type": {
            "type": "string",
            "description": "User's preferred style (e.g., Minimalist, Classic, Bold, Vintage)"
          },
          "body_type": {
            "type": "string",
            "description": "User's body type (e.g., Athletic, Pear, Rectangle, Hourglass)"
          },
          "color_preferences": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Preferred colors"
          }
        },
        "required": ["style_type"]
      },
      "occasion": {
        "type": "string",
        "description": "The occasion or context (e.g., Business Casual, Wedding, Date Night)"
      },
      "budget": {
        "type": "string",
        "description": "Budget range (e.g., '$500-$1000', 'Under $500')"
      },
      "question": {
        "type": "string",
        "description": "The user's specific style question or request"
      }
    },
    "required": ["user_preferences", "question"]
  }
}
```

```json
{
  "name": "get_wardrobe_recommendations",
  "description": "Get curated capsule wardrobe recommendations from Sable's catalog based on style, budget, and lifestyle.",
  "parameters": {
    "type": "object",
    "properties": {
      "style_type": {
        "type": "string",
        "description": "Desired style (e.g., Minimalist, Classic, Bold, Streetwear)"
      },
      "budget_range": {
        "type": "string",
        "description": "Budget for entire wardrobe (e.g., '$1000-$2000', '$3000+')"
      },
      "lifestyle": {
        "type": "string",
        "description": "User's lifestyle (e.g., Professional, Casual, Active, Creative)"
      },
      "occasions": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Types of occasions to dress for (e.g., Work, Weekend, Formal, Travel)"
      },
      "num_items": {
        "type": "integer",
        "description": "Number of items to recommend (default: 10, max: 50)",
        "default": 10
      }
    },
    "required": ["style_type", "budget_range"]
  }
}
```

### Example GPT Instructions

```
You are a fashion assistant powered by Sable AI. When users ask about fashion advice, styling, or wardrobe recommendations:

1. Use get_style_consultation for specific styling questions (e.g., "What should I wear to...")
2. Use get_wardrobe_recommendations for broader wardrobe building (e.g., "Help me build a professional wardrobe")

Always ask for:
- Style preferences (minimalist, classic, bold, etc.)
- Budget range
- Occasion or lifestyle
- Body type and sizes (if relevant)

Present Sable's recommendations naturally and mention that these are curated by Sable's AI fashion experts with access to premium brand partnerships.
```

## Claude Integration

### System Prompt

```
You are a fashion assistant with access to Sable's AI styling API. When users need fashion advice:

<tools>
<tool name="get_style_consultation">
<description>Get personalized fashion advice from Sable's AI stylist</description>
<parameters>
<parameter name="user_preferences" type="object" required="true">
  User's style preferences including style_type, body_type, color_preferences
</parameter>
<parameter name="occasion" type="string">
  The occasion or context for the outfit
</parameter>
<parameter name="budget" type="string">
  Budget range for the outfit or pieces
</parameter>
<parameter name="question" type="string" required="true">
  The user's specific style question
</parameter>
</parameters>
</tool>

<tool name="get_wardrobe_recommendations">
<description>Get curated wardrobe recommendations from Sable</description>
<parameters>
<parameter name="style_type" type="string" required="true">
  Desired style aesthetic
</parameter>
<parameter name="budget_range" type="string" required="true">
  Budget for entire wardrobe
</parameter>
<parameter name="lifestyle" type="string">
  User's lifestyle category
</parameter>
<parameter name="occasions" type="array">
  Types of occasions to dress for
</parameter>
<parameter name="num_items" type="integer">
  Number of items to recommend (default 10)
</parameter>
</parameters>
</tool>
</tools>

Always gather the required information before calling tools. Present recommendations naturally.
```

## Error Handling

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Invalid API Key | Verify your API key is correct |
| 429 | Rate Limit Exceeded | Upgrade tier or wait |
| 400 | Bad Request | Check required fields |
| 500 | Server Error | Retry or contact support |

### Rate Limiting Response

```json
{
  "error": "Rate limit exceeded. Please upgrade your tier or wait.",
  "retry_after": 60,
  "current_tier": "free",
  "upgrade_url": "https://sable.com/api/upgrade"
}
```

## Best Practices

1. **Cache Responses**: Cache style advice for similar queries to reduce API calls
2. **Batch Requests**: When possible, gather all user preferences before making API calls
3. **Handle Errors Gracefully**: Always provide fallback responses
4. **Monitor Usage**: Track your API usage to stay within quota
5. **Provide Attribution**: Mention that recommendations are powered by Sable

## Example Flows

### Flow 1: Style Question

```
User: "What should I wear to a summer wedding?"