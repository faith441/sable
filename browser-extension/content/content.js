// Sable Closet Companion - Content Script
// Detects clothing items on web pages and extracts product information

(function() {
  'use strict';

  // Product detection patterns for popular retailers
  const RETAILER_PATTERNS = {
    amazon: {
      domain: 'amazon.com',
      selectors: {
        title: '#productTitle, #title',
        price: '.a-price-whole, #priceblock_ourprice, #priceblock_dealprice',
        image: '#landingImage, #imgBlkFront',
        brand: '#bylineInfo, .a-size-base.po-break-word',
        category: '#wayfinding-breadcrumbs_feature_div'
      }
    },
    asos: {
      domain: 'asos.com',
      selectors: {
        title: 'h1[class*="product-title"]',
        price: '[data-id="current-price"]',
        image: 'img[class*="fullImageElement"]',
        brand: '[class*="product-brand"]',
        category: '[class*="breadcrumb"]'
      }
    },
    zara: {
      domain: 'zara.com',
      selectors: {
        title: '.product-detail-info__header-name',
        price: '.price__amount',
        image: '.media-image__image',
        brand: '[data-qa-action="brand"]',
        category: '.breadcrumbs'
      }
    },
    hm: {
      domain: 'hm.com',
      selectors: {
        title: 'h1.ProductName-module--productName',
        price: '[class*="ProductPrice"]',
        image: '[class*="ProductMedia"] img',
        brand: 'meta[property="og:brand"]',
        category: '.Breadcrumbs'
      }
    },
    nordstrom: {
      domain: 'nordstrom.com',
      selectors: {
        title: 'h1[data-id="product-title"]',
        price: '[data-id="current-price"]',
        image: 'img[data-component="PrimaryImage"]',
        brand: '[itemprop="brand"]',
        category: '[data-component="Breadcrumb"]'
      }
    },
    // Generic fallback for other sites
    generic: {
      selectors: {
        title: 'h1, [class*="product-title"], [class*="product-name"], meta[property="og:title"]',
        price: '[class*="price"], [itemprop="price"], meta[property="og:price:amount"]',
        image: '[class*="product-image"] img, [itemprop="image"], meta[property="og:image"]',
        brand: '[class*="brand"], [itemprop="brand"], meta[property="og:brand"]',
        category: '[class*="breadcrumb"], [class*="category"]'
      }
    }
  };

  // Fashion keywords to identify clothing/fashion items
  const FASHION_KEYWORDS = [
    'shirt', 'pants', 'dress', 'skirt', 'jacket', 'coat', 'sweater',
    'blouse', 'jeans', 'shorts', 'suit', 'blazer', 'cardigan', 'hoodie',
    'shoes', 'boots', 'sneakers', 'heels', 'sandals', 'flats',
    'jewelry', 'necklace', 'bracelet', 'earrings', 'ring', 'watch',
    'bag', 'handbag', 'purse', 'backpack', 'wallet',
    'accessories', 'scarf', 'hat', 'belt', 'sunglasses',
    'clothing', 'apparel', 'fashion', 'outfit', 'wear'
  ];

  // Detect current retailer
  function detectRetailer() {
    const hostname = window.location.hostname;
    for (const [retailer, config] of Object.entries(RETAILER_PATTERNS)) {
      if (retailer !== 'generic' && hostname.includes(config.domain)) {
        return retailer;
      }
    }
    return 'generic';
  }

  // Extract text from element using selector
  function extractText(selector) {
    const element = document.querySelector(selector);
    if (!element) return null;

    // Check for meta tags
    if (element.tagName === 'META') {
      return element.getAttribute('content');
    }

    return element.textContent?.trim() || null;
  }

  // Extract image from element using selector
  function extractImage(selector) {
    const element = document.querySelector(selector);
    if (!element) return null;

    if (element.tagName === 'META') {
      return element.getAttribute('content');
    }

    if (element.tagName === 'IMG') {
      return element.src || element.getAttribute('data-src');
    }

    return null;
  }

  // Check if page contains fashion/clothing items
  function isFashionPage() {
    const pageText = document.body.textContent.toLowerCase();
    const title = document.title.toLowerCase();
    const metaDescription = document.querySelector('meta[name="description"]')?.content?.toLowerCase() || '';

    const combinedText = `${pageText} ${title} ${metaDescription}`;

    return FASHION_KEYWORDS.some(keyword => combinedText.includes(keyword));
  }

  // Extract product information
  function extractProductInfo() {
    const retailer = detectRetailer();
    const config = RETAILER_PATTERNS[retailer];
    const selectors = config.selectors || RETAILER_PATTERNS.generic.selectors;

    // Try multiple selectors for each field
    const tryMultipleSelectors = (selectorString) => {
      const selectors = selectorString.split(',').map(s => s.trim());
      for (const selector of selectors) {
        const result = extractText(selector);
        if (result) return result;
      }
      return null;
    };

    const tryMultipleImageSelectors = (selectorString) => {
      const selectors = selectorString.split(',').map(s => s.trim());
      for (const selector of selectors) {
        const result = extractImage(selector);
        if (result) return result;
      }
      return null;
    };

    const product = {
      title: tryMultipleSelectors(selectors.title),
      price: tryMultipleSelectors(selectors.price),
      image: tryMultipleImageSelectors(selectors.image),
      brand: tryMultipleSelectors(selectors.brand),
      category: tryMultipleSelectors(selectors.category),
      url: window.location.href,
      retailer: retailer,
      timestamp: new Date().toISOString()
    };

    // Clean up price (remove currency symbols, etc.)
    if (product.price) {
      product.price = product.price.replace(/[^0-9.,]/g, '');
    }

    return product;
  }

  // Send product info to background script
  function sendProductInfo(product) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_DETECTED',
      product: product
    });
  }

  // Initialize when page is ready
  function init() {
    // Check if this is a fashion/clothing page
    if (isFashionPage()) {
      const product = extractProductInfo();

      // Only send if we have at least a title and image
      if (product.title && product.image) {
        sendProductInfo(product);

        // Store product info for popup
        chrome.storage.local.set({ currentProduct: product });
      }
    }
  }

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PRODUCT_INFO') {
      const product = extractProductInfo();
      sendResponse({ product });
    }
    return true;
  });

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
