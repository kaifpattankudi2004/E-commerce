const API_URL = 'https://dummyjson.com/products';
const productGrid = document.getElementById('productGrid');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const categorySelect = document.getElementById('categorySelect');
const searchInput = document.getElementById('searchInput');
const cartToggle = document.querySelector('.cart-toggle');
const cartPanel = document.getElementById('cartPanel');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalItems = document.getElementById('cartTotalItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const closeCart = document.querySelector('.close-cart');
const toast = document.getElementById('toast');
const checkoutButton = document.getElementById('checkoutButton');

let products = [];
let filteredProducts = [];
let cart = {};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  toast.classList.remove('hidden');
  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('hidden');
  }, 2200);
}

function showLoading() {
  productGrid.classList.add('hidden');
  errorState.classList.add('hidden');
  loadingState.classList.remove('hidden');
  loadingState.innerHTML = Array.from({ length: 8 })
    .map(
      () => `
      <article class="skeleton-card">
        <div class="skeleton-block skeleton-media"></div>
        <div class="skeleton-block skeleton-line"></div>
        <div class="skeleton-block skeleton-line short"></div>
        <div class="skeleton-block skeleton-line"></div>
      </article>
    `
    )
    .join('');
}

function showError(message) {
  loadingState.classList.add('hidden');
  productGrid.classList.add('hidden');
  errorState.classList.remove('hidden');
  errorState.textContent = message;
}

function renderCategories(items) {
  const categories = Array.from(new Set(items.map((item) => item.category))).sort();
  categorySelect.innerHTML = '<option value="all">All Categories</option>' + categories.map(
    (category) => `<option value="${category}">${category}</option>`
  ).join('');
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function renderProducts(items) {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  productGrid.classList.remove('hidden');

  if (!items.length) {
    productGrid.innerHTML = '<p class="error-message">No products match your search. Try another keyword or category.</p>';
    return;
  }

  productGrid.innerHTML = items
    .map((product) => `
      <article class="product-card">
        <div class="product-media">
          <img loading="lazy" src="${product.thumbnail}" alt="${product.title}" />
        </div>
        <div>
          <h3>${product.title}</h3>
          <div class="product-meta">
            <span class="product-price">${formatPrice(product.price)}</span>
            <span class="product-rating">⭐ ${product.rating.toFixed(1)}</span>
          </div>
        </div>
        <button type="button" data-product-id="${product.id}">Add to Cart</button>
      </article>
    `)
    .join('');

  document.querySelectorAll('.product-card button').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number(button.dataset.productId);
      const product = products.find((item) => item.id === productId);
      addToCart(product);
    });
  });
}

function saveCart() {
  localStorage.setItem('modernShopCart', JSON.stringify(cart));
}

function loadCart() {
  const savedCart = localStorage.getItem('modernShopCart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (error) {
      cart = {};
    }
  }
}

function updateCartCount() {
  const count = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  document.querySelector('.cart-count').textContent = count;
}

function updateCartSummary() {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartTotalItems.textContent = totalItems;
  cartTotalPrice.textContent = formatPrice(totalPrice);
}

function setCartVisible(visible) {
  cartPanel.classList.toggle('visible', visible);
  cartPanel.classList.toggle('hidden', !visible);
}

function removeCartItem(productId) {
  delete cart[productId];
  saveCart();
  renderCart();
  updateCartCount();
  showToast('Item removed from cart');
}

function changeQuantity(productId, delta) {
  if (!cart[productId]) return;
  cart[productId].quantity = Math.max(1, cart[productId].quantity + delta);
  saveCart();
  renderCart();
  updateCartCount();
}

function addToCart(product) {
  if (!product) return;
  if (cart[product.id]) {
    cart[product.id].quantity += 1;
  } else {
    cart[product.id] = {
      ...product,
      quantity: 1,
    };
  }
  saveCart();
  updateCartCount();
  renderCart();
  showToast(`${product.title} added to cart`);
}

function renderCart() {
  const cartItems = Object.values(cart);
  cartItemsContainer.innerHTML = cartItems.length
    ? cartItems
        .map(
          (item) => `
          <article class="cart-item">
            <img loading="lazy" src="${item.thumbnail}" alt="${item.title}" />
            <div class="cart-item-details">
              <p class="cart-item-title">${item.title}</p>
              <div class="cart-item-meta">
                <span>${formatPrice(item.price)}</span>
                <button type="button" class="remove-item" data-action="remove" data-id="${item.id}">Remove</button>
              </div>
              <div class="quantity-control">
                <button type="button" data-action="decrease" data-id="${item.id}">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-action="increase" data-id="${item.id}">+</button>
              </div>
            </div>
          </article>
        `
        )
        .join('')
    : '<p class="muted">Your cart is empty. Add a product to begin.</p>';

  cartItemsContainer.querySelectorAll('[data-action]').forEach((button) => {
    const productId = Number(button.dataset.id);
    const action = button.dataset.action;

    button.addEventListener('click', () => {
      if (action === 'remove') {
        removeCartItem(productId);
      }
      if (action === 'increase') {
        changeQuantity(productId, 1);
      }
      if (action === 'decrease') {
        changeQuantity(productId, -1);
      }
    });
  });

  updateCartSummary();
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;

  filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchSearch = product.title.toLowerCase().includes(query);
    return matchCategory && matchSearch;
  });

  renderProducts(filteredProducts);
}

function setupEventListeners() {
  searchInput.addEventListener('input', () => {
    applyFilters();
  });

  categorySelect.addEventListener('change', () => {
    applyFilters();
  });

  cartToggle.addEventListener('click', () => {
    setCartVisible(!cartPanel.classList.contains('visible'));
  });

  closeCart.addEventListener('click', () => {
    setCartVisible(false);
  });

  checkoutButton.addEventListener('click', () => {
    showToast('Checkout is a demo action — cart is saved locally.');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cartPanel.classList.contains('visible')) {
      setCartVisible(false);
    }
  });
}

async function fetchProducts() {
  showLoading();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Network error while loading products');
    }

    const data = await response.json();
    products = data.products || [];
    filteredProducts = [...products];

    renderCategories(products);
    renderProducts(filteredProducts);
  } catch (error) {
    showError('Unable to load products. Please refresh the page.');
    console.error(error);
  }
}

function initialize() {
  loadCart();
  updateCartCount();
  renderCart();
  setupEventListeners();
  fetchProducts();
}

initialize();
