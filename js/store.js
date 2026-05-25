// ============================================================
// FERRAGEM LENDÁRIA — Store JS
// ============================================================

// ---- STATE ----
let allProducts = [];
let allCategories = [];
let cart = JSON.parse(localStorage.getItem('fl_cart') || '[]');
let currentSlide = 0;
let slideInterval;

// ---- SUPABASE (fallback demo data se não conectado) ----
const DEMO_CATEGORIES = [
  { id: '1', nome: 'Ferramentas Manuais', icone: '🔨', descricao: 'Martelos, chaves, alicates' },
  { id: '2', nome: 'Ferramentas Elétricas', icone: '⚡', descricao: 'Furadeiras, serras elétricas' },
  { id: '3', nome: 'Parafusos e Fixadores', icone: '🔩', descricao: 'Parafusos, porcas, pregos' },
  { id: '4', nome: 'Tubagens e Conexões', icone: '🔧', descricao: 'Canos, joelhos, válvulas' },
  { id: '5', nome: 'Tintas e Acabamentos', icone: '🎨', descricao: 'Tintas, vernizes, pincéis' },
  { id: '6', nome: 'Elétrica', icone: '💡', descricao: 'Cabos, tomadas, disjuntores' },
  { id: '7', nome: 'Cimento e Argamassa', icone: '🏗️', descricao: 'Cimento, areia, blocos' },
  { id: '8', nome: 'Madeira e Derivados', icone: '🪵', descricao: 'Tábuas, MDF, portas' },
  { id: '9', nome: 'Segurança e EPI', icone: '🦺', descricao: 'Capacetes, luvas, botas' },
  { id: '10', nome: 'Jardinagem', icone: '🌿', descricao: 'Enxadas, mangueiras, sementes' },
  { id: '11', nome: 'Hidráulica', icone: '💧', descricao: 'Bombas, filtros, caixas d\'água' },
  { id: '12', nome: 'Portões e Grades', icone: '🚪', descricao: 'Portões, fechaduras, grades' },
];

const DEMO_PRODUCTS = [
  { id: 'p1', nome: 'Martelo de Carpinteiro 500g', descricao: 'Martelo profissional com cabo de madeira de alta resistência. Ideal para pregar e desmontar estruturas.', preco: 450, quantidade: 30, categoria_id: '1', icone: '🔨', unidade: 'un' },
  { id: 'p2', nome: 'Furadeira Elétrica 650W', descricao: 'Furadeira de impacto com velocidade variável, mandril de 13mm. Perfeita para concreto, madeira e metal.', preco: 5500, quantidade: 12, categoria_id: '2', icone: '⚡', unidade: 'un' },
  { id: 'p3', nome: 'Parafuso Sextavado M8 x 40 (c/50)', descricao: 'Parafusos sextavados zincados, alta resistência. Embalagem com 50 unidades.', preco: 280, quantidade: 150, categoria_id: '3', icone: '🔩', unidade: 'cx' },
  { id: 'p4', nome: 'Cano PVC 110mm (6m)', descricao: 'Cano de PVC para esgoto, resistente e durável. Comprimento de 6 metros.', preco: 780, quantidade: 40, categoria_id: '4', icone: '🔧', unidade: 'un' },
  { id: 'p5', nome: 'Tinta Acrílica Branca 20L', descricao: 'Tinta acrílica lavável, excelente cobertura e durabilidade. Rendimento: até 280m².', preco: 2800, quantidade: 25, categoria_id: '5', icone: '🎨', unidade: 'balde' },
  { id: 'p6', nome: 'Cabo Elétrico 2.5mm (100m)', descricao: 'Cabo de cobre flexível, isolamento de PVC, 2,5mm². Rolo com 100 metros.', preco: 3200, quantidade: 20, categoria_id: '6', icone: '💡', unidade: 'rolo' },
  { id: 'p7', nome: 'Cimento Portland 50kg', descricao: 'Cimento Portland CP II-F-32, alta qualidade para alvenaria, rebocos e estruturas.', preco: 950, quantidade: 200, categoria_id: '7', icone: '🏗️', unidade: 'saco' },
  { id: 'p8', nome: 'Tábua de Pinho 2.5x15cm (3m)', descricao: 'Tábua de pinho tratado, seca de forno. Dimensões: 2,5 x 15 x 300 cm.', preco: 620, quantidade: 60, categoria_id: '8', icone: '🪵', unidade: 'un' },
  { id: 'p9', nome: 'Capacete de Segurança', descricao: 'Capacete de proteção classe A/B, ajuste rápido, ventilado. Certificado CE.', preco: 380, quantidade: 35, categoria_id: '9', icone: '🦺', unidade: 'un' },
  { id: 'p10', nome: 'Mangueira de Jardim 25m', descricao: 'Mangueira reforçada anti-torção, com esguicho ajustável incluso. 25 metros.', preco: 850, quantidade: 18, categoria_id: '10', icone: '🌿', unidade: 'un' },
  { id: 'p11', nome: 'Alicate Universal 8"', descricao: 'Alicate universal com cabo emborrachado, aço cromo-vanádio temperado.', preco: 520, quantidade: 25, categoria_id: '1', icone: '🔨', unidade: 'un' },
  { id: 'p12', nome: 'Serra Circular 7-1/4" 1400W', descricao: 'Serra circular com disco de 185mm, profundidade de corte 66mm. Guia paralelo incluso.', preco: 8500, quantidade: 8, categoria_id: '2', icone: '⚡', unidade: 'un' },
  { id: 'p13', nome: 'Torneira de Parede 1/2"', descricao: 'Torneira cromada de alta resistência, rosca 1/2 polegada, fácil instalação.', preco: 320, quantidade: 45, categoria_id: '4', icone: '🔧', unidade: 'un' },
  { id: 'p14', nome: 'Disjuntor Bipolar 25A', descricao: 'Disjuntor termomagético bipolar 25A, 220V. Proteção de curto-circuito e sobrecarga.', preco: 450, quantidade: 50, categoria_id: '6', icone: '💡', unidade: 'un' },
  { id: 'p15', nome: 'Luvas de Vaqueta P/M/G', descricao: 'Luvas de raspa de couro para trabalhos pesados, palmeira reforçada.', preco: 180, quantidade: 60, categoria_id: '9', icone: '🦺', unidade: 'par' },
  { id: 'p16', nome: 'Bomba D\'Água 1/2cv Monofásica', descricao: 'Bomba centrífuga 1/2 cavalos, 220V, vazão máxima 3600 L/h.', preco: 12500, quantidade: 5, categoria_id: '11', icone: '💧', unidade: 'un' },
];

// ---- INIT ----
window.addEventListener('DOMContentLoaded', async () => {
  // Loader
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 1800);

  // Header scroll
  window.addEventListener('scroll', () => {
    document.getElementById('header').classList.toggle('scrolled', scrollY > 50);
  });

  // Slider
  initSlider();

  // Load data
  await loadData();

  // Render cart count
  updateCartUI();
});

// ---- SLIDER ----
function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.getElementById('sliderDots');

  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
  });

  slideInterval = setInterval(() => changeSlide(1), 5500);
}

function changeSlide(dir) {
  const slides = document.querySelectorAll('.slide');
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + dir + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  updateDots();
  resetInterval();
}

function goToSlide(i) {
  const slides = document.querySelectorAll('.slide');
  slides[currentSlide].classList.remove('active');
  currentSlide = i;
  slides[currentSlide].classList.add('active');
  updateDots();
  resetInterval();
}

function updateDots() {
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => changeSlide(1), 5500);
}

// ---- LOAD DATA ----
async function loadData() {
  try {
    if (window.db) {
      // Supabase
      const [catRes, prodRes] = await Promise.all([
        window.db.from('categorias').select('*').order('nome'),
        window.db.from('produtos').select('*, categorias(nome, icone)').eq('ativo', true).order('nome'),
      ]);
      allCategories = catRes.data || DEMO_CATEGORIES;
      allProducts = prodRes.data || DEMO_PRODUCTS;
    } else {
      throw new Error('No DB');
    }
  } catch {
    // Demo mode
    allCategories = DEMO_CATEGORIES;
    allProducts = DEMO_PRODUCTS;
  }

  renderCategories();
  renderProducts(allProducts);
  populateCategoryFilter();
}

// ---- CATEGORIES ----
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!allCategories.length) {
    grid.innerHTML = '<div class="loading-placeholder">Sem categorias</div>';
    return;
  }

  grid.innerHTML = allCategories.map(cat => {
    const count = allProducts.filter(p => p.categoria_id === cat.id).length;
    return `
    <div class="category-card" onclick="filterByCategory('${cat.id}')">
      <div class="category-icon">${cat.icone || '🔧'}</div>
      <div class="category-name">${cat.nome}</div>
      <div class="category-count">${count} produto${count !== 1 ? 's' : ''}</div>
    </div>`;
  }).join('');
}

function filterByCategory(catId) {
  document.getElementById('categoryFilter').value = catId;
  filterProducts();
  document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
}

function populateCategoryFilter() {
  const sel = document.getElementById('categoryFilter');
  allCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.nome;
    sel.appendChild(opt);
  });
}

// ---- PRODUCTS ----
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<div class="empty-state"><span>🔍</span><p>Nenhum produto encontrado</p></div>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const cat = allCategories.find(c => c.id === p.categoria_id);
    const catName = cat?.nome || p.categorias?.nome || '';
    const icon = cat?.icone || p.categorias?.icone || p.icone || '🔧';
    const imgTag = p.imagem_url
      ? `<img src="${p.imagem_url}" alt="${p.nome}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"product-no-img\\">${icon}</div>'" />`
      : `<div class="product-no-img">${icon}</div>`;
    const outOfStock = p.quantidade === 0;

    return `
    <div class="product-card" data-id="${p.id}" data-category="${p.categoria_id}" data-price="${p.preco}" data-name="${p.nome.toLowerCase()}">
      <div class="product-img-wrap" onclick="openProductModal('${p.id}')">
        ${imgTag}
        ${outOfStock ? '<div class="product-badge tag-out">Esgotado</div>' : '<div class="product-badge">Disponível</div>'}
      </div>
      <div class="product-body">
        <div class="product-category">${catName}</div>
        <div class="product-name">${p.nome}</div>
        <div class="product-desc">${p.descricao || ''}</div>
        <div class="product-price">${formatMZN(p.preco)}<span>MT / ${p.unidade || 'un'}</span></div>
        <div class="product-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${p.id}', -1)">−</button>
            <input class="qty-input" type="number" id="qty_${p.id}" value="1" min="1" max="${p.quantidade || 999}" />
            <button class="qty-btn" onclick="changeQty('${p.id}', 1)">+</button>
          </div>
          <button class="add-cart-btn ${outOfStock ? 'out-of-stock' : ''}"
            onclick="${outOfStock ? '' : `addToCart('${p.id}')`}"
            ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Esgotado' : '+ Carrinho'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterProducts() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortFilter').value;

  let filtered = allProducts.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search) || (p.descricao || '').toLowerCase().includes(search);
    const matchCat = !category || p.categoria_id === category;
    return matchSearch && matchCat;
  });

  if (sort === 'preco_asc') filtered.sort((a, b) => a.preco - b.preco);
  else if (sort === 'preco_desc') filtered.sort((a, b) => b.preco - a.preco);
  else filtered.sort((a, b) => a.nome.localeCompare(b.nome));

  renderProducts(filtered);
}

// ---- PRODUCT MODAL ----
function openProductModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const cat = allCategories.find(c => c.id === p.categoria_id);
  const icon = cat?.icone || p.icone || '🔧';

  document.getElementById('modalContent').innerHTML = `
    <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
      <div style="flex:0 0 220px; height:220px; background:var(--black-3); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:5rem; overflow:hidden;">
        ${p.imagem_url ? `<img src="${p.imagem_url}" style="width:100%;height:100%;object-fit:cover" />` : icon}
      </div>
      <div style="flex:1; min-width:200px;">
        <div style="font-size:0.75rem; color:var(--orange); font-weight:700; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:0.5rem;">${cat?.nome || ''}</div>
        <h2 style="font-family:var(--font-head); font-size:1.5rem; font-weight:700; margin-bottom:0.75rem;">${p.nome}</h2>
        <p style="color:var(--gray-light); font-size:0.9rem; line-height:1.7; margin-bottom:1.5rem;">${p.descricao || 'Sem descrição disponível.'}</p>
        <div style="font-family:var(--font-display); font-size:2.5rem; color:var(--orange); margin-bottom:0.5rem;">${formatMZN(p.preco)}<span style="font-family:var(--font-head); font-size:0.85rem; color:var(--gray-light); margin-left:0.5rem;">MT / ${p.unidade || 'un'}</span></div>
        <div style="font-size:0.85rem; color:${p.quantidade > 0 ? 'var(--green)' : 'var(--red)'}; margin-bottom:1.5rem; font-weight:600;">
          ${p.quantidade > 0 ? `✓ Em estoque (${p.quantidade} ${p.unidade || 'un'})` : '✕ Esgotado'}
        </div>
        <div class="product-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('modal_${p.id}', -1)">−</button>
            <input class="qty-input" type="number" id="qty_modal_${p.id}" value="1" min="1" max="${p.quantidade || 999}" />
            <button class="qty-btn" onclick="changeQty('modal_${p.id}', 1)">+</button>
          </div>
          <button class="add-cart-btn" onclick="addToCartFromModal('${p.id}')">+ Adicionar ao Carrinho</button>
        </div>
      </div>
    </div>`;
  document.getElementById('productModal').classList.add('active');
}

function addToCartFromModal(id) {
  const input = document.getElementById(`qty_modal_${id}`);
  const qty = parseInt(input?.value || 1);
  addToCart(id, qty);
  document.getElementById('productModal').classList.remove('active');
}

function closeProductModal(e) {
  if (e.target === document.getElementById('productModal')) {
    document.getElementById('productModal').classList.remove('active');
  }
}

// ---- QTY ----
function changeQty(id, delta) {
  const input = document.getElementById(`qty_${id}`);
  if (!input) return;
  const val = Math.max(1, parseInt(input.value || 1) + delta);
  input.value = val;
}

// ---- CART ----
function addToCart(productId, qty = null) {
  const p = allProducts.find(x => x.id === productId);
  if (!p || p.quantidade === 0) return;

  const input = document.getElementById(`qty_${productId}`);
  const quantity = qty || parseInt(input?.value || 1);

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, p.quantidade);
  } else {
    cart.push({
      id: p.id,
      nome: p.nome,
      preco: p.preco,
      unidade: p.unidade || 'un',
      icone: allCategories.find(c => c.id === p.categoria_id)?.icone || p.icone || '🔧',
      imagem_url: p.imagem_url || null,
      quantity,
    });
  }

  saveCart();
  updateCartUI();
  showToast(`✓ ${p.nome} adicionado!`, 'success');
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function updateCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  updateCartUI();
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('fl_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cartCount').textContent = count;

  const total = cart.reduce((s, i) => s + i.preco * i.quantity, 0);
  document.getElementById('cartTotal').textContent = formatMZN(total) + ' MT';

  const itemsEl = document.getElementById('cartItems');
  if (!cart.length) {
    itemsEl.innerHTML = '<div class="cart-empty"><span>🛒</span><p>Carrinho vazio</p></div>';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imagem_url ? `<img src="${item.imagem_url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />` : item.icone}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nome}</div>
        <div class="cart-item-price">${formatMZN(item.preco)} MT / ${item.unidade}</div>
      </div>
      <div class="cart-item-controls">
        <div class="cart-qty">
          <button class="cqb" onclick="updateCartQty('${item.id}', -1)">−</button>
          <span class="cqn">${item.quantity}</span>
          <button class="cqb" onclick="updateCartQty('${item.id}', 1)">+</button>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${item.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('active');
  document.getElementById('cartOverlay').classList.toggle('active');
}

// ---- INVOICE PDF ----
function generateInvoice() {
  if (!cart.length) { showToast('Carrinho vazio!', 'error'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const total = cart.reduce((s, i) => s + i.preco * i.quantity, 0);
  const invoiceNum = 'FL-' + Date.now().toString().slice(-8);
  const now = new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Colors
  const orange = [255, 107, 0];
  const black = [10, 10, 10];
  const gray = [120, 120, 120];
  const lightGray = [240, 240, 240];

  // Header bg
  doc.setFillColor(...black);
  doc.rect(0, 0, 210, 45, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('FERRAGEM LENDÁRIA', 15, 20);

  doc.setFontSize(9);
  doc.setTextColor(...orange);
  doc.text('⚙ A SUA FERRAGEM DE CONFIANÇA EM MOÇAMBIQUE', 15, 28);

  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('+258 72 599 084  |  adaddasmaravilhas@gmail.com', 15, 36);

  // Orange stripe
  doc.setFillColor(...orange);
  doc.rect(0, 45, 210, 3, 'F');

  // Invoice info box
  doc.setFillColor(245, 245, 245);
  doc.rect(120, 52, 75, 35, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...orange);
  doc.text('FATURA', 157, 63, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text(`N.º: ${invoiceNum}`, 125, 71);
  doc.text(`Data: ${now}`, 125, 78);
  doc.setTextColor(...gray);
  doc.text('Válida por 30 dias', 125, 85);

  // Client section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...orange);
  doc.text('CLIENTE', 15, 63);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...black);
  doc.text('Nome: ____________________________________', 15, 71);
  doc.text('Tel.: ____________________________________', 15, 79);

  // Table header
  const tableTop = 98;
  doc.setFillColor(...black);
  doc.rect(10, tableTop, 190, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUTO', 14, tableTop + 7);
  doc.text('QTD', 120, tableTop + 7, { align: 'center' });
  doc.text('PREÇO UNIT.', 152, tableTop + 7, { align: 'center' });
  doc.text('SUBTOTAL', 196, tableTop + 7, { align: 'right' });

  // Table rows
  let y = tableTop + 10;
  cart.forEach((item, idx) => {
    const sub = item.preco * item.quantity;
    if (idx % 2 === 0) {
      doc.setFillColor(...lightGray);
      doc.rect(10, y, 190, 9, 'F');
    }
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const name = item.nome.length > 45 ? item.nome.slice(0, 42) + '...' : item.nome;
    doc.text(name, 14, y + 6.5);
    doc.text(`${item.quantity} ${item.unidade}`, 120, y + 6.5, { align: 'center' });
    doc.text(formatMZN(item.preco) + ' MT', 152, y + 6.5, { align: 'center' });
    doc.text(formatMZN(sub) + ' MT', 196, y + 6.5, { align: 'right' });
    y += 9;
  });

  // Bottom line
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.8);
  doc.line(10, y + 3, 200, y + 3);

  // Total box
  doc.setFillColor(...orange);
  doc.rect(130, y + 6, 70, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', 135, y + 16);
  doc.setFontSize(13);
  doc.text(formatMZN(total) + ' MT', 196, y + 16, { align: 'right' });

  // Footer
  doc.setFillColor(...black);
  doc.rect(0, 272, 210, 25, 'F');
  doc.setTextColor(...orange);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Obrigado pela sua preferência!', 105, 281, { align: 'center' });
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Ferragem Lendária · Moçambique · adaddasmaravilhas@gmail.com', 105, 289, { align: 'center' });

  doc.save(`Fatura_FerrragemLendaria_${invoiceNum}.pdf`);
  showToast('📄 Fatura gerada com sucesso!', 'success');
}

// ---- UTILS ----
function formatMZN(val) {
  return parseFloat(val).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('cartPanel').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
  }
});
