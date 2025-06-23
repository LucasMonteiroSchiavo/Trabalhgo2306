// Elementos DOM
const loginContainer = document.getElementById("login-container");
const main = document.getElementById("main");
const checkoutForm = document.getElementById("checkout-form");
const loading = document.getElementById("loading");

// Estado da aplicação
let products = [];
let cart = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  loadCartFromStorage();
  updateCartDisplay();
  
  // Enter key no login
  document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      login();
    }
  });
});

// Função de login
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (user && pass) {
    loginContainer.classList.add("hidden");
    main.classList.remove("hidden");
    loadProducts();
  } else {
    alert("Preencha usuário e senha.");
  }
}

// Função de logout
function logout() {
  loginContainer.classList.remove("hidden");
  main.classList.add("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  cart = [];
  localStorage.removeItem("cart");
  updateCartDisplay();
}

// Carregar produtos da API
async function loadProducts() {
  loading.classList.remove("hidden");
  
  try {
    const response = await fetch("https://fakestoreapi.com/products");
    products = await response.json();
    displayProducts();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    alert("Erro ao carregar produtos. Tente novamente.");
  } finally {
    loading.classList.add("hidden");
  }
}

// Exibir produtos na tela
function displayProducts() {
  const container = document.getElementById("products");
  container.innerHTML = "";

  products.forEach(product => {
    const productDiv = document.createElement("div");
    productDiv.className = "product";
    
    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.title}" onerror="this.src='/placeholder.svg?height=200&width=200'">
      <div class="product-title">${product.title}</div>
      <div class="product-price">R$ ${product.price.toFixed(2)}</div>
      <button onclick="addToCart(${product.id})" class="btn-primary">
        <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
      </button>
    `;
    
    container.appendChild(productDiv);
  });
}

// Adicionar produto ao carrinho
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  
  saveCartToStorage();
  updateCartDisplay();
  
  // Feedback visual
  showNotification(`${product.title} adicionado ao carrinho!`);
}

// Remover produto do carrinho
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartDisplay();
}

// Atualizar quantidade
function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = newQuantity;
    saveCartToStorage();
    updateCartDisplay();
  }
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
  const cartContainer = document.getElementById("cart");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  const totalAmount = document.getElementById("total-amount");
  
  // Atualizar contador no header
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
  
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p class="empty-cart">Carrinho vazio</p>';
    cartTotal.classList.add("hidden");
    return;
  }
  
  // Exibir itens do carrinho
  cartContainer.innerHTML = "";
  let total = 0;
  
  cart.forEach(item => {
    total += item.price * item.quantity;
    
    const cartItemDiv = document.createElement("div");
    cartItemDiv.className = "cart-item";
    
    cartItemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.title}" onerror="this.src='/placeholder.svg?height=60&width=60'">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
      </div>
      <div class="quantity-controls">
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
          <i class="fas fa-minus"></i>
        </button>
        <span class="quantity-display">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remover item">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    cartContainer.appendChild(cartItemDiv);
  });
  
  // Exibir total
  totalAmount.textContent = total.toFixed(2);
  cartTotal.classList.remove("hidden");
}

// Ir para checkout
function checkout() {
  if (cart.length === 0) {
    alert("Carrinho vazio!");
    return;
  }
  
  main.classList.add("hidden");
  checkoutForm.classList.remove("hidden");
  displayOrderSummary();
}

// Voltar para tela principal
function backToMain() {
  checkoutForm.classList.add("hidden");
  main.classList.remove("hidden");
}

// Exibir resumo do pedido
function displayOrderSummary() {
  const orderItems = document.getElementById("order-items");
  const checkoutTotal = document.getElementById("checkout-total");
  
  orderItems.innerHTML = "";
  let total = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const orderItem = document.createElement("div");
    orderItem.className = "order-item";
    orderItem.innerHTML = `
      <span>${item.title} (x${item.quantity})</span>
      <span>R$ ${itemTotal.toFixed(2)}</span>
    `;
    orderItems.appendChild(orderItem);
  });
  
  checkoutTotal.textContent = total.toFixed(2);
}

// Confirmar pedido
function confirmOrder() {
  const address = document.getElementById("address").value.trim();
  const payment = document.getElementById("payment").value;

  if (!address) {
    alert("Informe o endereço.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const paymentLabels = {
    'pix': 'Pix',
    'boleto': 'Boleto',
    'cartao': 'Cartão'
  };

  alert(`Pedido confirmado com sucesso!\n\nEndereço: ${address}\nPagamento: ${paymentLabels[payment]}\nTotal: R$ ${total.toFixed(2)}\n\nObrigado pela preferência!`);
  
  // Limpar carrinho e voltar ao início
  cart = [];
  localStorage.removeItem("cart");
  document.getElementById("address").value = "";
  
  checkoutForm.classList.add("hidden");
  main.classList.remove("hidden");
  updateCartDisplay();
}

// Salvar carrinho no localStorage
function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

// Mostrar notificação (feedback visual)
function showNotification(message) {
  // Criar elemento de notificação
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}