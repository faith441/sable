// Sable Closet Companion - Popup Script

const SABLE_APP_URL = 'https://getsable.ai';
const API_ENDPOINT = `${SABLE_APP_URL}/api`;

// Views
const views = {
  loading: document.getElementById('loading'),
  noProduct: document.getElementById('no-product'),
  productView: document.getElementById('product-view'),
  successView: document.getElementById('success-view'),
  errorView: document.getElementById('error-view')
};

// Elements
const elements = {
  productImg: document.getElementById('product-img'),
  productTitle: document.getElementById('product-title'),
  productBrand: document.getElementById('product-brand'),
  productPrice: document.getElementById('product-price'),
  productCategory: document.getElementById('product-category'),
  clothingType: document.getElementById('clothing-type'),
  tags: document.getElementById('tags'),
  notes: document.getElementById('notes'),
  addToCloset: document.getElementById('add-to-closet'),
  openApp: document.getElementById('open-app'),
  viewCloset: document.getElementById('view-closet'),
  addAnother: document.getElementById('add-another'),
  tryAgain: document.getElementById('try-again'),
  errorMessage: document.getElementById('error-message'),
  settingsBtn: document.getElementById('settings-btn'),
  logoutBtn: document.getElementById('logout-btn')
};

let currentProduct = null;

// Show specific view
function showView(viewName) {
  Object.values(views).forEach(view => view.style.display = 'none');
  views[viewName].style.display = 'block';
}

// Get auth token from storage
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['authToken'], (result) => {
      resolve(result.authToken);
    });
  });
}

// Set auth token in storage
async function setAuthToken(token) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ authToken: token }, resolve);
  });
}

// Load product information
async function loadProduct() {
  try {
    // Get product from storage (set by content script)
    const result = await chrome.storage.local.get(['currentProduct']);

    if (result.currentProduct && result.currentProduct.title) {
      currentProduct = result.currentProduct;
      displayProduct(currentProduct);
      showView('productView');
    } else {
      // Try to get product from current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: 'GET_PRODUCT_INFO' }, (response) => {
        if (chrome.runtime.lastError) {
          showView('noProduct');
          return;
        }

        if (response && response.product && response.product.title) {
          currentProduct = response.product;
          displayProduct(currentProduct);
          showView('productView');
        } else {
          showView('noProduct');
        }
      });
    }
  } catch (error) {
    console.error('Error loading product:', error);
    showView('noProduct');
  }
}

// Display product information in popup
function displayProduct(product) {
  elements.productImg.src = product.image || '';
  elements.productImg.alt = product.title || 'Product image';
  elements.productTitle.textContent = product.title || 'Unknown Product';
  elements.productBrand.textContent = product.brand || '';
  elements.productPrice.textContent = product.price ? `$${product.price}` : '';
  elements.productCategory.textContent = product.category || '';

  // Auto-select clothing type based on title/category
  autoSelectClothingType(product);
}

// Auto-select clothing type based on product info
function autoSelectClothingType(product) {
  const text = `${product.title} ${product.category}`.toLowerCase();

  const typeKeywords = {
    tops: ['shirt', 'blouse', 't-shirt', 'tee', 'top', 'sweater', 'cardigan', 'hoodie'],
    bottoms: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings'],
    dresses: ['dress', 'gown', 'frock'],
    outerwear: ['jacket', 'coat', 'blazer', 'parka', 'windbreaker'],
    shoes: ['shoes', 'boots', 'sneakers', 'heels', 'sandals', 'flats', 'loafers'],
    accessories: ['scarf', 'hat', 'belt', 'gloves', 'sunglasses'],
    jewelry: ['necklace', 'bracelet', 'earrings', 'ring', 'jewelry'],
    bags: ['bag', 'handbag', 'purse', 'backpack', 'tote', 'clutch']
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      elements.clothingType.value = type;
      break;
    }
  }
}

// Add item to closet
async function addToCloset() {
  try {
    // Disable button
    elements.addToCloset.disabled = true;
    elements.addToCloset.textContent = 'Adding...';

    const authToken = await getAuthToken();

    // Prepare item data
    const itemData = {
      name: currentProduct.title,
      brand: currentProduct.brand,
      price: currentProduct.price,
      image: currentProduct.image,
      category: elements.clothingType.value,
      tags: elements.tags.value.split(',').map(t => t.trim()).filter(t => t),
      notes: elements.notes.value,
      sourceUrl: currentProduct.url,
      retailer: currentProduct.retailer,
      addedAt: new Date().toISOString()
    };

    // For now, store locally (in production, send to backend)
    // TODO: Implement actual API call when backend is ready
    await saveToLocalStorage(itemData);

    // If user is logged in, also send to backend
    if (authToken) {
      await sendToBackend(itemData, authToken);
    }

    showView('successView');
  } catch (error) {
    console.error('Error adding to closet:', error);
    elements.errorMessage.textContent = error.message || 'Failed to add item to closet. Please try again.';
    showView('errorView');
  } finally {
    elements.addToCloset.disabled = false;
    elements.addToCloset.textContent = 'Add to Closet';
  }
}

// Save item to local storage
async function saveToLocalStorage(itemData) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['closetItems'], (result) => {
      const items = result.closetItems || [];
      items.push(itemData);
      chrome.storage.local.set({ closetItems: items }, resolve);
    });
  });
}

// Send item to backend API
async function sendToBackend(itemData, authToken) {
  const response = await fetch(`${API_ENDPOINT}/closet/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(itemData)
  });

  if (!response.ok) {
    throw new Error('Failed to sync with server');
  }

  return response.json();
}

// Open Sable app
function openApp(path = '') {
  chrome.tabs.create({ url: `${SABLE_APP_URL}${path}` });
}

// Event listeners
elements.addToCloset.addEventListener('click', addToCloset);
elements.openApp.addEventListener('click', () => openApp());
elements.viewCloset.addEventListener('click', () => openApp('/closet'));
elements.addAnother.addEventListener('click', () => {
  loadProduct();
});
elements.tryAgain.addEventListener('click', () => {
  loadProduct();
});

elements.settingsBtn.addEventListener('click', () => {
  openApp('/settings');
});

elements.logoutBtn.addEventListener('click', async () => {
  await setAuthToken(null);
  chrome.storage.local.clear();
  alert('Logged out successfully');
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadProduct();
});
