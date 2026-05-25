// ============================================================
// FERRAGEM LENDÁRIA — Store JS  (v2)
// Dados 100% do Admin via localStorage partilhado / Supabase
// ============================================================

let allProducts  = [];
let allCategories = [];
let cart = JSON.parse(localStorage.getItem('fl_cart') || '[]');
let currentSlide = 0;
let slideInterval;

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 1600);
  window.addEventListener('scroll', () => {
    document.getElementById('header').classList.toggle('scrolled', scrollY > 50);
  });
  initSlider();
  await loadData();
  updateCartUI();

  // mobile menu toggle
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileNav').classList.toggle('active');
  });
});

// ============================================================
// SLIDER
// ============================================================
function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.getElementById('sliderDots');
  slides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goToSlide(i);
    dots.appendChild(d);
  });
  slideInterval = setInterval(() => changeSlide(1), 5500);
}
function changeSlide(dir) {
  const slides = document.querySelectorAll('.slide');
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + dir + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  updateDots(); resetInterval();
}
function goToSlide(i) {
  document.querySelectorAll('.slide')[currentSlide].classList.remove('active');
  currentSlide = i;
  document.querySelectorAll('.slide')[currentSlide].classList.add('active');
  updateDots(); resetInterval();
}
function updateDots() {
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}
function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => changeSlide(1), 5500);
}

// ============================================================
// LOAD DATA — only from Admin's storage (localStorage or Supabase)
// ============================================================
async function loadData() {
  try {
    if (window.db) {
      const [catRes, prodRes] = await Promise.all([
        window.db.from('categorias').select('*').order('nome'),
        window.db.from('produtos').select('*, categorias(nome,icone)').eq('ativo', true).gt('quantidade', -1).order('nome'),
      ]);
      if (catRes.data?.length)  allCategories = catRes.data;
      if (prodRes.data?.length) allProducts   = prodRes.data;
    }
  } catch(e) { console.warn('Supabase not connected, using localStorage:', e); }

  // Fallback: read exactly what admin saved in localStorage
  if (!allCategories.length)
    allCategories = JSON.parse(localStorage.getItem('fl_cats')    || '[]');
  if (!allProducts.length)
    allProducts   = JSON.parse(localStorage.getItem('fl_products') || '[]');

  // Only show active products with qty > 0 or show all active (admin decides)
  allProducts = allProducts.filter(p => p.ativo !== false);

  renderCategories();
  renderProducts(allProducts);
  populateCategoryFilter();
}

// ============================================================
// CATEGORIES
// ============================================================
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  const cats = allCategories.filter(c => allProducts.some(p => p.categoria_id === c.id));
  if (!cats.length) {
    grid.innerHTML = '<div class="loading-placeholder">Sem categorias disponíveis</div>';
    return;
  }
  grid.innerHTML = cats.map(cat => {
    const count = allProducts.filter(p => p.categoria_id === cat.id).length;
    return `<div class="category-card" onclick="filterByCategory('${cat.id}')">
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
  sel.innerHTML = '<option value="">Todas as categorias</option>';
  allCategories.filter(c => allProducts.some(p => p.categoria_id === c.id))
    .forEach(cat => {
      const o = document.createElement('option');
      o.value = cat.id; o.textContent = cat.nome;
      sel.appendChild(o);
    });
}

// ============================================================
// PRODUCTS
// ============================================================
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<div class="empty-state"><span>🔍</span><p>Nenhum produto encontrado</p></div>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const cat     = allCategories.find(c => c.id === p.categoria_id);
    const catName = cat?.nome || p.categorias?.nome || '';
    const icon    = cat?.icone || p.categorias?.icone || p.icone || '🔧';
    const imgTag  = p.imagem_url
      ? `<img src="${p.imagem_url}" alt="${p.nome}" loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\"product-no-img\\">${icon}</div>'" />`
      : `<div class="product-no-img">${icon}</div>`;
    const outOfStock = p.quantidade === 0;
    const lowStock   = p.quantidade > 0 && p.quantidade <= (p.quantidade_minima || 5);

    return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap" onclick="openProductModal('${p.id}')">
        ${imgTag}
        ${outOfStock
          ? '<div class="product-badge tag-out">Esgotado</div>'
          : lowStock
            ? `<div class="product-badge tag-low">Últimas ${p.quantidade} un.</div>`
            : '<div class="product-badge">Disponível</div>'}
      </div>
      <div class="product-body">
        <div class="product-id-tag">ID: ${p.id}</div>
        <div class="product-category">${catName}</div>
        <div class="product-name">${p.nome}</div>
        <div class="product-desc">${p.descricao || ''}</div>
        <div class="product-price">${fmz(p.preco)}<span>MT / ${p.unidade || 'un'}</span></div>
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
  const search   = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const sort     = document.getElementById('sortFilter').value;
  let filtered   = allProducts.filter(p => {
    const ms = p.nome.toLowerCase().includes(search) || (p.descricao || '').toLowerCase().includes(search) || String(p.id).toLowerCase().includes(search);
    const mc = !category || p.categoria_id === category;
    return ms && mc;
  });
  if (sort === 'preco_asc')  filtered.sort((a,b) => a.preco - b.preco);
  else if (sort === 'preco_desc') filtered.sort((a,b) => b.preco - a.preco);
  else filtered.sort((a,b) => a.nome.localeCompare(b.nome));
  renderProducts(filtered);
}

// ============================================================
// PRODUCT MODAL
// ============================================================
function openProductModal(id) {
  const p   = allProducts.find(x => x.id === id); if (!p) return;
  const cat = allCategories.find(c => c.id === p.categoria_id);
  const icon = cat?.icone || p.icone || '🔧';
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-product-layout">
      <div class="modal-product-img">
        ${p.imagem_url ? `<img src="${p.imagem_url}" style="width:100%;height:100%;object-fit:cover" />` : `<span style="font-size:5rem">${icon}</span>`}
      </div>
      <div class="modal-product-info">
        <div class="product-id-tag">ID: ${p.id}</div>
        <div class="product-category">${cat?.nome || ''}</div>
        <h2 style="font-family:var(--font-head);font-size:1.5rem;font-weight:700;margin-bottom:.75rem">${p.nome}</h2>
        <p style="color:var(--gray-light);font-size:.9rem;line-height:1.7;margin-bottom:1.5rem">${p.descricao || 'Sem descrição.'}</p>
        <div class="product-price" style="font-size:2rem;margin-bottom:.5rem">${fmz(p.preco)}<span>MT / ${p.unidade || 'un'}</span></div>
        <div style="font-size:.85rem;color:${p.quantidade > 0 ? 'var(--green)' : 'var(--red)'};margin-bottom:1.5rem;font-weight:600">
          ${p.quantidade > 0 ? `✓ Em estoque: ${p.quantidade} ${p.unidade || 'un'}` : '✕ Esgotado'}
        </div>
        <div class="product-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('modal_${p.id}',-1)">−</button>
            <input class="qty-input" type="number" id="qty_modal_${p.id}" value="1" min="1" max="${p.quantidade||999}" />
            <button class="qty-btn" onclick="changeQty('modal_${p.id}',1)">+</button>
          </div>
          <button class="add-cart-btn" onclick="addToCartFromModal('${p.id}')">+ Adicionar ao Carrinho</button>
        </div>
      </div>
    </div>`;
  document.getElementById('productModal').classList.add('active');
}

function addToCartFromModal(id) {
  const input = document.getElementById(`qty_modal_${id}`);
  addToCart(id, parseInt(input?.value || 1));
  document.getElementById('productModal').classList.remove('active');
}
function closeProductModal(e) {
  if (e.target === document.getElementById('productModal'))
    document.getElementById('productModal').classList.remove('active');
}

// ============================================================
// QTY CONTROL
// ============================================================
function changeQty(id, delta) {
  const input = document.getElementById(`qty_${id}`); if (!input) return;
  const max   = parseInt(input.max) || 999;
  const val   = Math.min(max, Math.max(1, parseInt(input.value || 1) + delta));
  input.value = val;
  // warn if exceeds stock
  const productId = id.replace('modal_','');
  const p = allProducts.find(x => x.id === productId);
  if (p && val > p.quantidade && p.quantidade > 0) {
    showToast(`⚠️ Apenas ${p.quantidade} unidades disponíveis`, 'error');
    input.value = p.quantidade;
  }
}

// ============================================================
// CART
// ============================================================
function addToCart(productId, qty = null) {
  const p = allProducts.find(x => x.id === productId);
  if (!p || p.quantidade === 0) return;

  const input    = document.getElementById(`qty_${productId}`);
  let quantity   = qty || parseInt(input?.value || 1);

  // enforce stock limit
  const existing = cart.find(i => i.id === productId);
  const inCart   = existing?.quantity || 0;
  const available= p.quantidade - inCart;
  if (quantity > available) {
    if (available <= 0) { showToast(`Quantidade máxima já no carrinho!`, 'error'); return; }
    showToast(`⚠️ Apenas ${p.quantidade} un. disponíveis. Ajustado.`, 'error');
    quantity = available;
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: p.id, nome: p.nome, preco: p.preco,
      unidade: p.unidade || 'un',
      icone: allCategories.find(c => c.id === p.categoria_id)?.icone || p.icone || '🔧',
      imagem_url: p.imagem_url || null,
      stockMax: p.quantidade,
      quantity,
    });
  }
  saveCart(); updateCartUI();
  showToast(`✓ ${p.nome} adicionado!`, 'success');
}

function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); updateCartUI(); }

function updateCartQty(id, delta) {
  const item = cart.find(i => i.id === id); if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty < 1) { removeFromCart(id); return; }
  if (newQty > (item.stockMax || 9999)) {
    showToast(`⚠️ Limite de stock atingido!`, 'error'); return;
  }
  item.quantity = newQty;
  saveCart(); updateCartUI();
}

function clearCart() { if (!cart.length) return; cart = []; saveCart(); updateCartUI(); }
function saveCart()  { localStorage.setItem('fl_cart', JSON.stringify(cart)); }

function updateCartUI() {
  const count = cart.reduce((s,i) => s + i.quantity, 0);
  document.getElementById('cartCount').textContent = count;
  const total = cart.reduce((s,i) => s + i.preco * i.quantity, 0);
  document.getElementById('cartTotal').textContent = fmz(total) + ' MT';

  const itemsEl = document.getElementById('cartItems');
  if (!cart.length) {
    itemsEl.innerHTML = '<div class="cart-empty"><span>🛒</span><p>Carrinho vazio</p></div>';
    return;
  }
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imagem_url
          ? `<img src="${item.imagem_url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />`
          : item.icone}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nome}</div>
        <div class="cart-item-price">${fmz(item.preco)} MT / ${item.unidade}</div>
      </div>
      <div class="cart-item-controls">
        <div class="cart-qty">
          <button class="cqb" onclick="updateCartQty('${item.id}',-1)">−</button>
          <span class="cqn">${item.quantity}</span>
          <button class="cqb" onclick="updateCartQty('${item.id}',1)">+</button>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${item.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('active');
  document.getElementById('cartOverlay').classList.toggle('active');
}

// ============================================================
// INVOICE — asks name + contact + optional NUIT first
// ============================================================
function generateInvoice() {
  if (!cart.length) { showToast('Carrinho vazio!', 'error'); return; }
  // Show client info modal before PDF
  document.getElementById('productModal').classList.add('active');
  document.getElementById('modalContent').innerHTML = `
    <div style="max-width:440px;margin:0 auto">
      <h2 style="font-family:var(--font-display);font-size:2rem;letter-spacing:.05em;margin-bottom:.25rem">📄 Dados da Fatura</h2>
      <p style="color:var(--gray-light);font-size:.85rem;margin-bottom:1.5rem">Preencha os dados do cliente para gerar a fatura em PDF</p>
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div>
          <label style="font-family:var(--font-head);font-size:.75rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);display:block;margin-bottom:.4rem">
            Nome do Cliente <span style="color:var(--red)">*</span>
          </label>
          <input id="inv_nome" type="text" placeholder="Nome completo"
            style="width:100%;background:var(--black-3);border:1px solid var(--black-4);color:var(--white);padding:.75rem 1rem;border-radius:4px;font-size:.95rem;transition:.25s"
            onfocus="this.style.borderColor='var(--orange)'" onblur="this.style.borderColor='var(--black-4)'" />
        </div>
        <div>
          <label style="font-family:var(--font-head);font-size:.75rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);display:block;margin-bottom:.4rem">
            Contacto / Telefone <span style="color:var(--red)">*</span>
          </label>
          <input id="inv_tel" type="tel" placeholder="+258 84 000 0000"
            style="width:100%;background:var(--black-3);border:1px solid var(--black-4);color:var(--white);padding:.75rem 1rem;border-radius:4px;font-size:.95rem;transition:.25s"
            onfocus="this.style.borderColor='var(--orange)'" onblur="this.style.borderColor='var(--black-4)'" />
        </div>
        <div>
          <label style="font-family:var(--font-head);font-size:.75rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);display:block;margin-bottom:.4rem">
            NUIT <span style="color:var(--gray-light);font-weight:400;text-transform:none;letter-spacing:0">(opcional)</span>
          </label>
          <input id="inv_nuit" type="text" placeholder="Número único de identificação tributária"
            style="width:100%;background:var(--black-3);border:1px solid var(--black-4);color:var(--white);padding:.75rem 1rem;border-radius:4px;font-size:.95rem;transition:.25s"
            onfocus="this.style.borderColor='var(--orange)'" onblur="this.style.borderColor='var(--black-4)'" />
        </div>
        <div id="inv_error" style="display:none;background:rgba(229,62,62,.15);border:1px solid rgba(229,62,62,.4);color:#f87171;border-radius:4px;padding:.75rem 1rem;font-size:.85rem;text-align:center"></div>
        <div style="display:flex;gap:.75rem;margin-top:.5rem">
          <button onclick="document.getElementById('productModal').classList.remove('active')"
            style="flex:0;padding:.75rem 1.25rem;background:var(--black-4);color:var(--white-dim);border-radius:4px;font-family:var(--font-head);font-weight:600;cursor:pointer">
            Cancelar
          </button>
          <button onclick="buildPDF()"
            style="flex:1;padding:.75rem;background:var(--orange);color:var(--black);border-radius:4px;font-family:var(--font-head);font-weight:700;font-size:1rem;cursor:pointer;transition:.25s"
            onmouseover="this.style.background='var(--orange-light)'" onmouseout="this.style.background='var(--orange)'">
            📄 Gerar PDF
          </button>
        </div>
      </div>
    </div>`;

  setTimeout(() => document.getElementById('inv_nome')?.focus(), 100);
  document.getElementById('inv_nome')?.addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('inv_tel')?.focus(); });
  document.getElementById('inv_tel')?.addEventListener('keydown',  e => { if (e.key==='Enter') document.getElementById('inv_nuit')?.focus(); });
  document.getElementById('inv_nuit')?.addEventListener('keydown', e => { if (e.key==='Enter') buildPDF(); });
}

function buildPDF() {
  const nome = document.getElementById('inv_nome')?.value.trim();
  const tel  = document.getElementById('inv_tel')?.value.trim();
  const nuit = document.getElementById('inv_nuit')?.value.trim();
  const errEl= document.getElementById('inv_error');

  if (!nome) { errEl.textContent='❌ Nome do cliente é obrigatório.'; errEl.style.display='block'; document.getElementById('inv_nome').focus(); return; }
  if (!tel)  { errEl.textContent='❌ Contacto/telefone é obrigatório.'; errEl.style.display='block'; document.getElementById('inv_tel').focus(); return; }
  errEl.style.display='none';

  document.getElementById('productModal').classList.remove('active');
  generatePDF(nome, tel, nuit);
}

function generatePDF(clientName, clientTel, clientNuit='') {
  const { jsPDF } = window.jspdf;
  const doc   = new jsPDF({ unit:'mm', format:'a4' });
  const total = cart.reduce((s,i) => s + i.preco * i.quantity, 0);
  const num   = 'FL-' + Date.now().toString().slice(-8);
  const now   = new Date().toLocaleDateString('pt-MZ', { day:'2-digit', month:'2-digit', year:'numeric' });

  const C = { orange:[255,107,0], black:[10,10,10], white:[255,255,255], gray:[120,120,120], lgray:[245,245,245], dkgray:[50,50,50] };

  // === HEADER ===
  doc.setFillColor(...C.black);
  doc.rect(0,0,210,50,'F');
  doc.setFillColor(...C.orange);
  doc.rect(0,50,210,3,'F');

  doc.setTextColor(...C.white);
  doc.setFont('helvetica','bold');
  doc.setFontSize(26);
  doc.text('FERRAGEM LENDÁRIA', 15, 22);

  doc.setFontSize(8.5);
  doc.setTextColor(...C.orange);
  doc.text('⚙  A SUA FERRAGEM DE CONFIANÇA EM MOÇAMBIQUE', 15, 30);

  doc.setTextColor(160,160,160);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.text('+258 72 599 084  |  adaddasmaravilhas@gmail.com', 15, 38);
  doc.text('Moçambique', 15, 44);

  // === FATURA BOX (top-right) ===
  doc.setFillColor(...C.lgray);
  doc.roundedRect(128,55,72,38,2,2,'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.setTextColor(...C.orange);
  doc.text('FATURA', 164,68,{align:'center'});
  doc.setFontSize(8.5);
  doc.setTextColor(...C.black);
  doc.text(`N.º: ${num}`, 133, 76);
  doc.text(`Data: ${now}`, 133, 83);
  doc.setTextColor(...C.gray);
  doc.setFont('helvetica','normal');
  doc.text('Válida por 30 dias', 133, 90);

  // === CLIENT BOX ===
  doc.setFillColor(20,20,20);
  doc.roundedRect(10,57,110,36,2,2,'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.orange);
  doc.text('DADOS DO CLIENTE', 15, 66);
  doc.setFont('helvetica','normal');
  doc.setTextColor(200,200,200);
  doc.text(`Nome:     ${clientName}`, 15, 74);
  doc.text(`Contacto: ${clientTel}`, 15, 81);
  if (clientNuit) doc.text(`NUIT:     ${clientNuit}`, 15, 88);

  // === TABLE HEADER ===
  const tTop = 100;
  doc.setFillColor(...C.black);
  doc.rect(10, tTop, 190, 10, 'F');
  doc.setFillColor(...C.orange);
  doc.rect(10, tTop, 3, 10, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.text('PRODUTO / DESCRIÇÃO', 16, tTop+7);
  doc.text('QTD', 128, tTop+7, {align:'center'});
  doc.text('PREÇO UNIT.', 158, tTop+7, {align:'center'});
  doc.text('SUBTOTAL', 198, tTop+7, {align:'right'});

  // === TABLE ROWS ===
  let y = tTop + 10;
  cart.forEach((item, idx) => {
    const sub = item.preco * item.quantity;
    if (idx % 2 === 0) { doc.setFillColor(...C.lgray); doc.rect(10,y,190,9,'F'); }
    doc.setTextColor(...C.black);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    const name = item.nome.length > 48 ? item.nome.slice(0,45)+'...' : item.nome;
    doc.text(name, 16, y+6.5);
    doc.text(`${item.quantity} ${item.unidade}`, 128, y+6.5, {align:'center'});
    doc.text(fmz(item.preco)+' MT', 158, y+6.5, {align:'center'});
    doc.setFont('helvetica','bold');
    doc.text(fmz(sub)+' MT', 198, y+6.5, {align:'right'});
    y += 9;
  });

  // === SEPARATOR ===
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.6);
  doc.line(10, y+4, 200, y+4);

  // === TOTAL ===
  doc.setFillColor(...C.orange);
  doc.roundedRect(130, y+8, 70, 18, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.text('TOTAL A PAGAR:', 136, y+18);
  doc.setFontSize(13);
  doc.text(fmz(total)+' MT', 197, y+18, {align:'right'});

  // === FOOTER ===
  doc.setFillColor(...C.black);
  doc.rect(0, 268, 210, 29, 'F');
  doc.setFillColor(...C.orange);
  doc.rect(0, 268, 210, 1.5, 'F');
  doc.setTextColor(...C.orange);
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.text('Obrigado pela sua preferência!', 105, 278, {align:'center'});
  doc.setTextColor(140,140,140);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.text('Ferragem Lendária  ·  +258 72 599 084  ·  adaddasmaravilhas@gmail.com', 105, 285, {align:'center'});
  doc.setTextColor(80,80,80);
  doc.setFontSize(6.5);
  doc.text('Página criada por Pensador Sem Fronteiras "Do zero ao infinito"', 105, 292, {align:'center'});

  doc.save(`Fatura_FerrragemLendaria_${num}.pdf`);
  showToast('📄 Fatura gerada com sucesso!', 'success');
}

// ============================================================
// UTILS
// ============================================================
function fmz(v) {
  return parseFloat(v||0).toLocaleString('pt-MZ', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function showToast(msg, type='info') {
  let c = document.querySelector('.toast-container');
  if (!c) { c=document.createElement('div'); c.className='toast-container'; document.body.appendChild(c); }
  const t=document.createElement('div'); t.className=`toast ${type}`; t.textContent=msg;
  c.appendChild(t); setTimeout(()=>t.remove(), 3200);
}
document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('cartPanel').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('mobileNav')?.classList.remove('active');
  }
});
