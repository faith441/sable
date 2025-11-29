# Sable Brand Partner API Documentation

## Overview

The Sable Brand Partner API allows fashion brands to integrate their product catalogs, payment systems, order tracking, and garment metadata directly into the Sable platform. This enables the Sable AI to provide better recommendations and seamless order fulfillment.

## Base URL

```
https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1
```

## Authentication

All API requests require a Brand API Key passed in the `x-brand-api-key` header.

```bash
curl -H "x-brand-api-key: YOUR_API_KEY_HERE" \
     https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1/brand-api-products
```

## Endpoints

### 1. Products API

Manage your product catalog on the Sable platform.

#### GET /brand-api-products
Get all products for your brand.

**Response:**
```json
{
  "products": [...],
  "count": 42
}
```

#### POST /brand-api-products
Bulk sync products to Sable.

**Request Body:**
```json
{
  "products": [
    {
      "name": "Premium Cotton T-Shirt",
      "description": "Soft, breathable cotton tee",
      "price": 45.00,
      "category": "Tops",
      "image_url": "https://yourbrand.com/images/tshirt.jpg",
      "product_url": "https://yourbrand.com/products/tshirt",
      "sizes": ["XS", "S", "M", "L", "XL"],
      "colors": ["White", "Black", "Navy"],
      "tags": ["casual", "basic", "cotton"],
      "is_available": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": 1,
  "products": [...]
}
```

#### PUT /brand-api-products
Update a specific product.

**Request Body:**
```json
{
  "product_id": "uuid-here",
  "price": 39.99,
  "is_available": false
}
```

#### DELETE /brand-api-products
Delete a product.

**Request Body:**
```json
{
  "product_id": "uuid-here"
}
```

---

### 2. Garment Metadata API

Provide detailed garment information to help the AI make better recommendations.

#### POST /brand-api-garment-metadata
Add or update detailed metadata for a product.

**Request Body:**
```json
{
  "product_id": "uuid-here",
  "metadata": {
    "fabric_composition": {
      "cotton": 95,
      "elastane": 5
    },
    "care_instructions": ["Machine wash cold", "Tumble dry low", "Do not bleach"],
    "fit_type": "Regular Fit",
    "silhouette": "Straight",
    "neckline": "Crew Neck",
    "sleeve_length": "Short Sleeve",
    "pattern": "Solid",
    "season": ["Spring", "Summer", "Fall"],
    "occasion": ["Casual", "Work", "Weekend"],
    "style_tags": ["Minimalist", "Classic", "Versatile"],
    "layering_position": "Base",
    "formality_level": "Casual",
    "versatility_score": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {...}
}
```

#### GET /brand-api-garment-metadata
Get metadata for your products.

**Query Parameters:**
- `product_id` (optional) - Filter to specific product

**Response:**
```json
{
  "metadata": [...],
  "count": 10
}
```

#### POST /brand-api-garment-metadata/compatibility
Define which products work well together.

**Request Body:**
```json
{
  "product_id": "uuid-tshirt",
  "compatible_with": "uuid-jeans",
  "compatibility_score": 0.95,
  "compatibility_reasons": {
    "color_harmony": true,
    "style_match": true,
    "occasion_overlap": ["Casual", "Weekend"],
    "season_match": true
  }
}
```

---

### 3. Orders API

Sync orders and tracking information from your systems.

#### POST /brand-api-orders
Create or update an order.

**Request Body:**
```json
{
  "brand_order_id": "ORDER-12345",
  "user_email": "customer@example.com",
  "order_status": "processing",
  "tracking_number": "1Z999AA10123456784",
  "tracking_url": "https://tracking.example.com/1Z999AA10123456784",
  "items": [
    {
      "product_id": "uuid-here",
      "name": "Premium Cotton T-Shirt",
      "size": "M",
      "color": "Navy",
      "quantity": 2,
      "price": 45.00
    }
  ],
  "total_amount": 90.00,
  "payment_status": "paid",
  "fulfillment_status": "fulfilled",
  "shipping_address": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "metadata": {
    "shipping_method": "Standard",
    "estimated_delivery": "2025-12-05"
  }
}
```

**Response:**
```json
{
  "success": true,
  "order": {...}
}
```

#### PUT /brand-api-orders
Update order status or tracking.

**Request Body:**
```json
{
  "brand_order_id": "ORDER-12345",
  "order_status": "shipped",
  "tracking_number": "1Z999AA10123456784",
  "tracking_url": "https://tracking.example.com/1Z999AA10123456784"
}
```

#### GET /brand-api-orders
Get orders for your brand.

**Query Parameters:**
- `brand_order_id` (optional) - Get specific order
- `status` (optional) - Filter by status

**Response:**
```json
{
  "orders": [...],
  "count": 25
}
```

---

### 4. Webhooks API

Receive real-time updates from your systems.

#### POST /brand-api-webhooks
Webhook receiver for various events.

**Request Headers:**
```
x-brand-api-key: YOUR_API_KEY
x-webhook-signature: SIGNATURE_HASH (optional)
```

**Request Body:**
```json
{
  "event_type": "order.fulfilled",
  "timestamp": "2025-11-29T12:00:00Z",
  "data": {
    "order_id": "ORDER-12345",
    "status": "fulfilled",
    "tracking_number": "1Z999AA10123456784",
    "tracking_url": "https://tracking.example.com/1Z999AA10123456784"
  }
}
```

**Supported Event Types:**
- `order.created` - New order created
- `order.updated` - Order details updated
- `order.fulfilled` - Order shipped/fulfilled
- `order.cancelled` - Order cancelled
- `product.created` - New product added
- `product.updated` - Product details updated
- `inventory.updated` - Stock levels changed
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed

**Response:**
```json
{
  "received": true,
  "processed": "order_updated"
}
```

---

## Metadata Fields Guide

### Fabric Composition
JSON object with fabric types and percentages:
```json
{
  "cotton": 95,
  "elastane": 5
}
```

### Fit Types
- `Slim Fit`
- `Regular Fit`
- `Relaxed Fit`
- `Oversized`
- `Tailored`

### Layering Position
- `Base` - Base layer (underwear, t-shirts)
- `Mid` - Mid layer (shirts, sweaters)
- `Outer` - Outer layer (jackets, coats)

### Formality Levels
- `Casual`
- `Smart Casual`
- `Business Casual`
- `Formal`
- `Black Tie`

### Versatility Score
Float between 0.0 and 1.0 indicating how well the item pairs with other pieces.
- `0.9-1.0` - Extremely versatile (basic tees, jeans)
- `0.7-0.9` - Very versatile
- `0.5-0.7` - Moderately versatile
- `0.3-0.5` - Specific use
- `0.0-0.3` - Very specific/statement pieces

---

## Integration Examples

### Node.js / Express
```javascript
const axios = require('axios');

const BASE_URL = 'https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1';
const API_KEY = 'your-api-key-here';

async function syncProducts(products) {
  const response = await axios.post(
    `${BASE_URL}/brand-api-products`,
    { products },
    { headers: { 'x-brand-api-key': API_KEY } }
  );
  return response.data;
}

async function updateOrderTracking(orderId, trackingNumber, trackingUrl) {
  const response = await axios.put(
    `${BASE_URL}/brand-api-orders`,
    {
      brand_order_id: orderId,
      order_status: 'shipped',
      tracking_number: trackingNumber,
      tracking_url: trackingUrl
    },
    { headers: { 'x-brand-api-key': API_KEY } }
  );
  return response.data;
}
```

### Python
```python
import requests

BASE_URL = 'https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1'
API_KEY = 'your-api-key-here'

def sync_products(products):
    response = requests.post(
        f'{BASE_URL}/brand-api-products',
        json={'products': products},
        headers={'x-brand-api-key': API_KEY}
    )
    return response.json()

def update_order_tracking(order_id, tracking_number, tracking_url):
    response = requests.put(
        f'{BASE_URL}/brand-api-orders',
        json={
            'brand_order_id': order_id,
            'order_status': 'shipped',
            'tracking_number': tracking_number,
            'tracking_url': tracking_url
        },
        headers={'x-brand-api-key': API_KEY}
    )
    return response.json()
```

### Shopify Integration
```javascript
// Webhook handler for Shopify
app.post('/webhooks/shopify/orders/create', async (req, res) => {
  const order = req.body;
  
  // Sync to Sable
  await axios.post(
    'https://lfsfzgkcygdzsgobgxwi.supabase.co/functions/v1/brand-api-orders',
    {
      brand_order_id: order.id.toString(),
      user_email: order.email,
      order_status: 'processing',
      items: order.line_items.map(item => ({
        product_id: item.product_id.toString(),
        name: item.title,
        size: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price)
      })),
      total_amount: parseFloat(order.total_price),
      payment_status: order.financial_status,
      shipping_address: order.shipping_address
    },
    { headers: { 'x-brand-api-key': process.env.SABLE_API_KEY } }
  );
  
  res.sendStatus(200);
});
```

---

## Rate Limits

- 1000 requests per hour per API key
- Bulk operations limited to 100 items per request

## Support

For API key generation and support, contact your Sable account manager or visit the admin portal at https://[your-domain]/admin