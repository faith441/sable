# AI Outfit Recommendations & Virtual Try-On Guide

## Overview

This feature allows users to get personalized outfit recommendations from the AI stylist and virtually try them on using AI-generated avatars.

## User Flow

### 1. AI Chat Interface (`/ai-stylist`)

**Welcome Screen:**
- Greeting: "Good morning, [Name]" (pulls from user preferences)
- Subtitle: "How can I style you?"
- Input placeholder: "I want to look professional and stylish at work"

**User Interaction:**
1. User types a style request (e.g., "I want to look professional and stylish at work")
2. AI responds with:
   - Text explanation
   - 1-2 outfit recommendations displayed as cards

**Outfit Recommendation Cards:**
- Outfit name (e.g., "Office Comfort", "Chic Office")
- Grid of 4 clothing items with images
- Two action buttons:
  - **"Try This On"** - Navigate to virtual try-on
  - **"Save Outfit"** - Add to favorites

### 2. Virtual Try-On (`/virtual-tryon`)

**When Arriving from AI Chat:**
- Title changes to: "Try On: [Outfit Name]"
- All outfit items are pre-selected
- Instructions: "Upload your photo to see yourself in this outfit"

**Item Selection:**
- User can click items to select/deselect them
- Selected items show:
  - Blue ring border (primary color)
  - Checkmark in top-right corner
- Unselected items appear with reduced opacity

**Try-On Process:**
1. User uploads their photo
2. Clicks "Try On X Items" button
3. AI generates avatar wearing selected items
4. Result shows with options to:
   - "Try Another" - Reset and start over
   - "Add to Cart" - Purchase the outfit items

## Technical Implementation

### Files Modified

1. **src/pages/AIStyleChat.tsx**
   - Added `OutfitRecommendation` interface
   - Enhanced `Message` interface with `outfits` property
   - Added `generateMockOutfits()` function for fallback
   - Updated message rendering to display outfit cards
   - Added navigation to virtual try-on on "Try This On" click

2. **src/pages/VirtualTryOn.tsx**
   - Added outfit loading from localStorage
   - Added `OutfitItem` and `OutfitRecommendation` interfaces
   - Implemented item selection/deselection
   - Enhanced UI to show outfit grid when loaded
   - Updated try-on logic to handle multiple items

### Data Flow

```typescript
// AI Chat sends outfit to try-on
localStorage.setItem('virtual-tryon-outfit', JSON.stringify(outfit));
navigate("/virtual-tryon");

// Try-On page loads outfit
const savedOutfit = localStorage.getItem('virtual-tryon-outfit');
const outfitData = JSON.parse(savedOutfit);
setOutfit(outfitData);
localStorage.removeItem('virtual-tryon-outfit'); // Clean up
```

### Mock Data Structure

```typescript
interface OutfitRecommendation {
  name: string;           // "Office Comfort"
  style: string;          // "professional-casual"
  items: Array<{
    name: string;         // "Classic Black Blazer"
    category: string;     // "Blazer"
    image_url?: string;   // Product image URL
  }>;
}
```

## Backend Integration (Future)

### AI Stylist Edge Function

The `ai-stylist-chat` edge function should return:

```typescript
{
  reply: string,  // Text response
  outfits?: OutfitRecommendation[]  // Optional outfit recommendations
}
```

**When to include outfits:**
- User asks for outfit recommendations
- User mentions specific occasions (work, casual, date, etc.)
- User asks for style advice with context

### Virtual Try-On Edge Function

The `virtual-tryon` edge function should accept:

```typescript
{
  userImage: string,      // Base64 user photo
  garmentImage?: string,  // Single garment (fallback)
  outfit?: OutfitItem[]   // Multiple items from outfit
}
```

And return:

```typescript
{
  result: string  // Base64 generated try-on image
}
```

## Current Mock Implementation

### Mock Outfit Scenarios

1. **Work/Professional/Office queries:**
   - "Office Comfort" - Blazer, sweater, trousers, heels
   - "Chic Office" - Navy blazer, silk blouse, pencil skirt, heels

2. **Casual/Weekend queries:**
   - "Weekend Ease" - Denim jacket, t-shirt, jeans, sneakers

3. **Default/Other queries:**
   - "Everyday Elegance" - Camel coat, turtleneck, jeans, ankle boots

### Image Sources

Mock images use Unsplash URLs with specific dimensions (400x600) for consistent display.

## Testing the Feature

### 1. Test AI Outfit Recommendations

1. Navigate to `/ai-stylist`
2. Type: "I want to look professional and stylish at work"
3. Send message
4. Expected result: 2 outfit cards ("Office Comfort", "Chic Office")

### 2. Test Virtual Try-On

1. From outfit card, click "Try This On"
2. Should navigate to `/virtual-tryon` with outfit pre-loaded
3. All 4 items should be selected by default
4. Click items to deselect/reselect
5. Upload user photo
6. Click "Try On X Items"
7. Should show result (currently shows mock - user photo as placeholder)

### 3. Test Manual Try-On (Without Outfit)

1. Navigate directly to `/virtual-tryon`
2. Upload user photo
3. Upload garment photo
4. Click "Try It On"
5. Should process single garment try-on

## UI/UX Features

### Chat Interface
- Outfit cards blend seamlessly with text responses
- Cards use subtle background (`bg-background/50`)
- Heart icon for favoriting
- Clear visual hierarchy

### Try-On Interface
- Dynamic title based on context
- Visual selection feedback (ring + checkmark)
- Item counter in button ("Try On 3 Items")
- Responsive grid layout

### Mobile Optimization
- All layouts are mobile-first
- Touch-friendly item selection
- Optimized image loading
- Smooth transitions

## Affiliate Integration

When backend is connected, outfit items can include:
- Product URLs
- Affiliate links
- Purchase buttons
- "Add to Cart" functionality

Link to [AFFILIATE_SETUP.md](./AFFILIATE_SETUP.md) for details.

## Future Enhancements

1. **Save Outfits**
   - Persist outfit recommendations to database
   - Create outfit collections
   - Share outfits with friends

2. **Enhanced Try-On**
   - Multiple angle views
   - Color variation options
   - Size recommendations
   - Mix-and-match different outfits

3. **Shopping Integration**
   - Direct purchase from try-on screen
   - Price display on outfit cards
   - In-stock indicators
   - Similar item suggestions

4. **Social Features**
   - Share try-on results
   - Get feedback from friends
   - Community outfit ratings
   - Style challenges

## Browser Compatibility

Tested on:
- Chrome 120+
- Safari 17+
- Firefox 120+
- Mobile Safari (iOS 17+)
- Chrome Mobile (Android 13+)

## Performance

- Outfit images lazy-load
- Base64 images cached in localStorage (temporary)
- Virtual try-on processing shows loading state
- HMR-enabled development (Vite)
