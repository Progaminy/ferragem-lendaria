// ============================================================
// FERRAGEM LENDÁRIA — Admin JS (Supabase Auth)
// ============================================================

let adminData = {
  products: [], categories: [], sales: [],
  purchases: [], debts: [], notifications: [],
};
let currentUser = null;

// ============================================================
// AUTH
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.Auth.getSession();
  if (session) {
    currentUser = session.user;
    showDashboard();
  }
  window.Auth.onAuthChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      showDashboard();
    } else if (event === 'SIGNED_OUT') {
      showLogin();
    }
  });
});

async function doSupabaseLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Por favor preencha o email e a senha.';
    errEl.style.display = 'block';
    return;
  }

  document.getElementById('loginBtnText').style.display = 'none';
  document.getElementById('loginBtnLoader').style.display = 'inline';
  btn.disabled = true;

  try {
    await window.Auth.signIn(email, password);
    // onAuthChange handles the rest
  } catch (err) {
    errEl.textContent = 'Credenciais inválidas. Verifique o email e a senha.';
    errEl.style.display = 'block';
    document.getElementById('loginBtnText').style.display = 'inline';
    document.getElementById('loginBtnLoader').style.display = 'none';
    btn.disabled = false;
  }
}

async function doPasswordReset() {
  const email = document.getElementById('resetEmail').value.trim();
  const msgEl = document.getElementById('resetMsg');
  if (!email) return;
  try {
    await window.Auth.resetPassword(email);
    msgEl.textContent = '✓ Email de recuperação enviado! Verifique a caixa de entrada.';
    msgEl.style.display = 'block';
  } catch {
    msgEl.style.background = 'rgba(229,62,62,0.15)';
    msgEl.style.color = '#f87171';
    msgEl.textContent = 'Erro ao enviar email. Verifique o endereço.';
    msgEl.style.display = 'block';
  }
}

async function doLogout() {
  await window.Auth.signOut();
  showLogin();
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDash').style.display = 'none';
  document.getElementById('loginBtnText').style.display = 'inline';
  document.getElementById('loginBtnLoader').style.display = 'none';
  document.getElementById('loginBtn').disabled = false;
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDash').style.display = 'grid';
  if (currentUser) {
    document.getElementById('userEmail').textContent = currentUser.email;
  }
  initAdmin();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('formLogin').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('formReset').style.display = tab === 'reset' ? 'flex' : 'none';
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

function togglePassword() {
  const input = document.getElementById('loginPass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') doSupabaseLogin();
});

// ============================================================
// TABS
// ============================================================
function showTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  const titles = {
    dashboard: ['Dashboard', 'Visão geral da loja'],
    products:  ['Produtos', 'Gerir catálogo de produtos'],
    categories:['Categorias', 'Organizar categorias'],
    sales:     ['Vendas', 'Histórico e registo de vendas'],
    stock:     ['Estoque', 'Entradas e movimentos de stock'],
    debts:     ['Dívidas', 'Controlo financeiro'],
    notifications: ['Notificações', 'Alertas e avisos do sistema'],
  };
  document.getElementById('topbarTitle').textContent = titles[name]?.[0] || '';
  document.getElementById('topbarSub').textContent = titles[name]?.[1] || '';

  if (name === 'notifications') renderNotifications();
  if (name === 'debts') renderDebts();
  if (name === 'sales') renderSales();
  if (name === 'stock') renderPurchases();
}

// ============================================================
// INIT
// ============================================================
async function initAdmin() {
  await loadAdminData();
  renderDashboard();
  renderAdminProducts();
  renderAdminCategories();
  populateCategorySelects();
  checkLowStock();
  checkDebtAlerts();
}

async function loadAdminData() {
  try {
    if (window.db && currentUser) {
      const [cats, prods, sales, purchases, debts, notifs] = await Promise.all([
        window.db.from('categorias').select('*').order('nome'),
        window.db.from('produtos').select('*').order('nome'),
        window.db.from('vendas').select('*').order('created_at', { ascending: false }),
        window.db.from('compras').select('*').order('created_at', { ascending: false }),
        window.db.from('dividas').select('*').order('created_at', { ascending: false }),
        window.db.from('notificacoes').select('*').order('created_at', { ascending: false }),
      ]);
      adminData.categories  = cats.data      || [];
      adminData.products    = prods.data     || [];
      adminData.sales       = sales.data     || [];
      adminData.purchases   = purchases.data || [];
      adminData.debts       = debts.data     || [];
      adminData.notifications = notifs.data  || [];
      return;
    }
  } catch (e) { console.warn('Supabase load failed, using localStorage:', e); }

  // Fallback: localStorage demo data
  adminData.categories    = JSON.parse(localStorage.getItem('fl_cats')   || '[]');
  adminData.products      = JSON.parse(localStorage.getItem('fl_products')|| '[]');
  adminData.sales         = JSON.parse(localStorage.getItem('fl_sales')   || '[]');
  adminData.purchases     = JSON.parse(localStorage.getItem('fl_purchases')|| '[]');
  adminData.debts         = JSON.parse(localStorage.getItem('fl_debts')   || '[]');
  adminData.notifications = JSON.parse(localStorage.getItem('fl_notifications') || '[]');
  if (!adminData.categories.length) seedDemoData();
}

function saveLocal() {
  localStorage.setItem('fl_cats',          JSON.stringify(adminData.categories));
  localStorage.setItem('fl_products',      JSON.stringify(adminData.products));
  localStorage.setItem('fl_sales',         JSON.stringify(adminData.sales));
  localStorage.setItem('fl_purchases',     JSON.stringify(adminData.purchases));
  localStorage.setItem('fl_debts',         JSON.stringify(adminData.debts));
  localStorage.setItem('fl_notifications', JSON.stringify(adminData.notifications));
}

async function dbOp(table, op, data, matchCol, matchVal) {
  if (!window.db || !currentUser) return;
  try {
    switch (op) {
      case 'insert': return await window.db.from(table).insert(data);
      case 'update': return await window.db.from(table).update(data).eq(matchCol, matchVal);
      case 'delete': return await window.db.from(table).delete().eq(matchCol, matchVal);
    }
  } catch (e) { console.warn('DB op failed:', e); }
}

function seedDemoData() {
  adminData.categories = [
    {id:'cat1',nome:'Ferramentas Manuais',icone:'🔨',descricao:'Martelos, chaves, alicates'},
    {id:'cat2',nome:'Ferramentas Elétricas',icone:'⚡',descricao:'Furadeiras, serras'},
    {id:'cat3',nome:'Parafusos e Fixadores',icone:'🔩',descricao:'Parafusos, porcas, pregos'},
    {id:'cat4',nome:'Tubagens e Conexões',icone:'🔧',descricao:'Canos, joelhos, válvulas'},
    {id:'cat5',nome:'Tintas e Acabamentos',icone:'🎨',descricao:'Tintas, vernizes, pincéis'},
    {id:'cat6',nome:'Elétrica',icone:'💡',descricao:'Cabos, tomadas, disjuntores'},
    {id:'cat7',nome:'Cimento e Argamassa',icone:'🏗️',descricao:'Cimento, areia, blocos'},
    {id:'cat8',nome:'Madeira e Derivados',icone:'🪵',descricao:'Tábuas, MDF, portas'},
    {id:'cat9',nome:'Segurança e EPI',icone:'🦺',descricao:'Capacetes, luvas, botas'},
    {id:'cat10',nome:'Jardinagem',icone:'🌿',descricao:'Enxadas, mangueiras'},
    {id:'cat11',nome:'Hidráulica',icone:'💧',descricao:'Bombas, filtros'},
    {id:'cat12',nome:'Portões e Grades',icone:'🚪',descricao:'Portões, fechaduras'},
  ];
  adminData.products = [
    {id:'p1',nome:'Martelo Carpinteiro 500g',descricao:'Cabo de madeira resistente',preco:450,quantidade:30,quantidade_minima:5,categoria_id:'cat1',unidade:'un',ativo:true},
    {id:'p2',nome:'Furadeira Elétrica 650W',descricao:'Furadeira de impacto variável',preco:5500,quantidade:3,quantidade_minima:5,categoria_id:'cat2',unidade:'un',ativo:true},
    {id:'p3',nome:'Parafuso M8x40 (cx/50)',descricao:'Parafusos zincados',preco:280,quantidade:150,quantidade_minima:20,categoria_id:'cat3',unidade:'cx',ativo:true},
    {id:'p4',nome:'Cano PVC 110mm 6m',descricao:'Cano de esgoto PVC',preco:780,quantidade:2,quantidade_minima:10,categoria_id:'cat4',unidade:'un',ativo:true},
    {id:'p5',nome:'Tinta Acrílica Branca 20L',descricao:'Tinta lavável alta cobertura',preco:2800,quantidade:25,quantidade_minima:5,categoria_id:'cat5',unidade:'balde',ativo:true},
    {id:'p6',nome:'Cabo Elétrico 2.5mm 100m',descricao:'Cabo de cobre flexível',preco:3200,quantidade:20,quantidade_minima:3,categoria_id:'cat6',unidade:'rolo',ativo:true},
    {id:'p7',nome:'Cimento Portland 50kg',descricao:'CP II-F-32 alta qualidade',preco:950,quantidade:200,quantidade_minima:30,categoria_id:'cat7',unidade:'saco',ativo:true},
    {id:'p8',nome:'Capacete de Segurança',descricao:'Classe A/B ajuste rápido',preco:380,quantidade:35,quantidade_minima:5,categoria_id:'cat9',unidade:'un',ativo:true},
  ];
  adminData.debts = [
    {id:'d1',tipo:'a_receber',nome_contato:'João Machava',telefone:'+258841234567',descricao:'Materiais construção',valor:15000,valor_pago:5000,data_vencimento:'2025-08-30',status:'parcial',notificar:true,created_at:new Date().toISOString()},
    {id:'d2',tipo:'a_pagar',nome_contato:'Fornecedor Silva',telefone:'+258849876543',descricao:'Compra de ferramentas',valor:45000,valor_pago:0,data_vencimento:'2025-07-15',status:'pendente',notificar:true,created_at:new Date().toISOString()},
  ];
  saveLocal();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const revenue  = adminData.sales.reduce((s,v)=>s+parseFloat(v.total||0),0);
  const lowStock = adminData.products.filter(p=>p.quantidade<=p.quantidade_minima);
  const debtsOwed= adminData.debts.filter(d=>d.tipo==='a_pagar'&&d.status!=='pago')
                     .reduce((s,d)=>s+(parseFloat(d.valor)-parseFloat(d.valor_pago||0)),0);

  document.getElementById('statProducts').textContent   = adminData.products.length;
  document.getElementById('statCategories').textContent = adminData.categories.length;
  document.getElementById('statLowStock').textContent   = lowStock.length;
  document.getElementById('statSales').textContent      = adminData.sales.length;
  document.getElementById('statRevenue').textContent    = fmz(revenue)+' MT';
  document.getElementById('statDebtsOwed').textContent  = fmz(debtsOwed)+' MT';

  document.getElementById('lowStockList').innerHTML = lowStock.length
    ? lowStock.slice(0,6).map(p=>`<div class="list-item"><span class="item-name">${p.nome}</span><span class="item-val red">${p.quantidade} (mín:${p.quantidade_minima})</span></div>`).join('')
    : '<div class="list-item"><span class="item-name" style="color:var(--green)">✓ Todos os stocks OK</span></div>';

  document.getElementById('recentSalesList').innerHTML = adminData.sales.slice(0,5)
    .map(s=>`<div class="list-item"><span class="item-name">${s.numero_fatura} · ${s.cliente_nome||'Balcão'}</span><span class="item-val green">${fmz(s.total)} MT</span></div>`).join('')
    || '<div class="list-item"><span class="item-name">Sem vendas</span></div>';

  document.getElementById('recentDebtsList').innerHTML = adminData.debts.slice(0,5)
    .map(d=>`<div class="list-item"><span class="item-name">${d.nome_contato} ${d.tipo==='a_receber'?'↑':'↓'}</span><span class="item-val ${d.tipo==='a_receber'?'green':'red'}">${fmz(d.valor)} MT</span></div>`).join('')
    || '<div class="list-item"><span class="item-name">Sem dívidas</span></div>';

  updateNotifBadge();
}

// ============================================================
// PRODUCTS
// ============================================================
function renderAdminProducts() {
  const q   = (document.getElementById('prodSearch')?.value||'').toLowerCase();
  const cat = document.getElementById('prodCatFilter')?.value||'';
  const list= adminData.products.filter(p=>{
    const ms = p.nome.toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q) || (p.descricao||'').toLowerCase().includes(q);
    return ms && (!cat||p.categoria_id===cat);
  });
  const tbody= document.getElementById('productsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-light)">Sem produtos</td></tr>';return;}
  tbody.innerHTML = list.map(p=>{
    const c=adminData.categories.find(x=>x.id===p.categoria_id);
    const ss= p.quantidade===0?'badge-danger':p.quantidade<=p.quantidade_minima?'badge-warn':'badge-ok';
    const sl= p.quantidade===0?'Esgotado':p.quantidade<=p.quantidade_minima?'Stock Baixo':'OK';
    return `<tr>
      <td>
        <span style="font-size:.65rem;font-family:monospace;background:var(--black-4);color:var(--gray-light);padding:.1rem .4rem;border-radius:3px;display:inline-block;margin-bottom:.25rem">ID: ${p.id}</span><br/>
        <strong style="color:var(--white)">${p.nome}</strong><br/><small style="color:var(--gray-light)">${(p.descricao||'').slice(0,50)}</small>
      </td>
      <td>${c?.icone||''} ${c?.nome||'—'}</td>
      <td style="color:var(--orange);font-family:var(--font-head);font-weight:700">${fmz(p.preco)} MT</td>
      <td><div class="stock-inline"><input type="number" id="sq_${p.id}" value="${p.quantidade}" min="0" /><button class="btn-sm btn-edit" onclick="updateStockInline('${p.id}')">✓</button></div></td>
      <td>${p.quantidade_minima} ${p.unidade||'un'}</td>
      <td><span class="badge ${ss}">${sl}</span></td>
      <td><div class="table-actions"><button class="btn-sm btn-edit" onclick="openProductForm('${p.id}')">✏ Editar</button><button class="btn-sm btn-del" onclick="deleteProduct('${p.id}')">🗑 Apagar</button></div></td>
    </tr>`;
  }).join('');
}

async function updateStockInline(id) {
  const qty = parseInt(document.getElementById('sq_'+id).value);
  const p   = adminData.products.find(x=>x.id===id);
  if(!p) return;
  p.quantidade = qty;
  await dbOp('produtos','update',{quantidade:qty},'id',id);
  saveLocal(); renderDashboard(); renderAdminProducts();
  showToast(`Stock de "${p.nome}" → ${qty}`,'success');
  if(qty<=p.quantidade_minima) addNotification('stock',`⚠️ Stock Baixo: ${p.nome}`,`Apenas ${qty} ${p.unidade||'un'} (mín: ${p.quantidade_minima})`);
}

function openProductForm(id=null) {
  const p = id ? adminData.products.find(x=>x.id===id) : null;
  document.getElementById('modalTitle').textContent = p ? 'Editar Produto' : 'Novo Produto';
  document.getElementById('adminModalContent').innerHTML = `
    <div class="form-grid">
      <div class="form-group full"><label class="form-label">Nome *</label><input class="form-input" id="fNome" value="${p?.nome||''}" placeholder="Ex: Martelo 500g" /></div>
      <div class="form-group full"><label class="form-label">Descrição</label><textarea class="form-textarea" id="fDesc">${p?.descricao||''}</textarea></div>
      <div class="form-group"><label class="form-label">Preço (MT) *</label><input class="form-input" id="fPreco" type="number" value="${p?.preco||''}" /></div>
      <div class="form-group"><label class="form-label">Categoria *</label>
        <select class="form-select" id="fCat">
          <option value="">Selecionar...</option>
          ${adminData.categories.map(c=>`<option value="${c.id}"${p?.categoria_id===c.id?' selected':''}>${c.icone} ${c.nome}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Stock Actual</label><input class="form-input" id="fQty" type="number" value="${p?.quantidade||0}" /></div>
      <div class="form-group"><label class="form-label">Stock Mínimo (alerta)</label><input class="form-input" id="fQtyMin" type="number" value="${p?.quantidade_minima||5}" /></div>
      <div class="form-group"><label class="form-label">Unidade</label>
        <select class="form-select" id="fUnit">
          ${['un','cx','kg','saco','rolo','balde','par','m','m²','L'].map(u=>`<option value="${u}"${p?.unidade===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">URL da Imagem</label><input class="form-input" id="fImg" value="${p?.imagem_url||''}" placeholder="https://..." /></div>
    </div>
    <div class="form-footer">
      <button class="btn-clear" onclick="document.getElementById('adminModal').classList.remove('active')">Cancelar</button>
      <button class="btn-orange" onclick="saveProduct('${id||''}')">💾 Guardar</button>
    </div>`;
  document.getElementById('adminModal').classList.add('active');
}

async function saveProduct(id) {
  const nome=document.getElementById('fNome').value.trim();
  const preco=parseFloat(document.getElementById('fPreco').value);
  const cat=document.getElementById('fCat').value;
  if(!nome||!preco||!cat){showToast('Preencha os campos obrigatórios!','error');return;}
  const data={nome,descricao:document.getElementById('fDesc').value,preco,categoria_id:cat,
    quantidade:parseInt(document.getElementById('fQty').value)||0,
    quantidade_minima:parseInt(document.getElementById('fQtyMin').value)||5,
    unidade:document.getElementById('fUnit').value,
    imagem_url:document.getElementById('fImg').value||null,ativo:true};
  if(id){
    const i=adminData.products.findIndex(p=>p.id===id);
    if(i!==-1) adminData.products[i]={...adminData.products[i],...data};
    await dbOp('produtos','update',data,'id',id);
    showToast('Produto actualizado!','success');
  } else {
    const np={id:'p'+Date.now(),...data};
    adminData.products.push(np);
    await dbOp('produtos','insert',data);
    showToast('Produto criado!','success');
  }
  saveLocal();
  document.getElementById('adminModal').classList.remove('active');
  renderAdminProducts(); renderDashboard();
}

async function deleteProduct(id) {
  const p=adminData.products.find(x=>x.id===id);
  if(!confirm(`Apagar "${p?.nome}"?`)) return;
  adminData.products=adminData.products.filter(x=>x.id!==id);
  await dbOp('produtos','delete',null,'id',id);
  saveLocal(); renderAdminProducts(); renderDashboard();
  showToast('Produto apagado!','success');
}

// ============================================================
// CATEGORIES
// ============================================================
function renderAdminCategories() {
  document.getElementById('categoriesAdminGrid').innerHTML = adminData.categories.map(c=>{
    const cnt=adminData.products.filter(p=>p.categoria_id===c.id).length;
    return `<div class="cat-admin-card">
      <div class="cat-admin-header"><div class="cat-admin-icon">${c.icone}</div><div><div class="cat-admin-name">${c.nome}</div><div style="font-size:.75rem;color:var(--orange)">${cnt} produto${cnt!==1?'s':''}</div></div></div>
      <div class="cat-admin-desc">${c.descricao||''}</div>
      <div class="cat-admin-footer"><button class="btn-sm btn-edit" onclick="openCategoryForm('${c.id}')">✏ Editar</button><button class="btn-sm btn-del" onclick="deleteCategory('${c.id}')">🗑</button></div>
    </div>`;
  }).join('');
}

function openCategoryForm(id=null) {
  const c=id?adminData.categories.find(x=>x.id===id):null;
  document.getElementById('modalTitle').textContent=c?'Editar Categoria':'Nova Categoria';
  document.getElementById('adminModalContent').innerHTML=`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="fcNome" value="${c?.nome||''}" /></div>
      <div class="form-group"><label class="form-label">Ícone (Emoji)</label><input class="form-input" id="fcIcone" value="${c?.icone||'🔧'}" /></div>
      <div class="form-group full"><label class="form-label">Descrição</label><textarea class="form-textarea" id="fcDesc">${c?.descricao||''}</textarea></div>
    </div>
    <div class="form-footer">
      <button class="btn-clear" onclick="document.getElementById('adminModal').classList.remove('active')">Cancelar</button>
      <button class="btn-orange" onclick="saveCategory('${id||''}')">💾 Guardar</button>
    </div>`;
  document.getElementById('adminModal').classList.add('active');
}

async function saveCategory(id) {
  const nome=document.getElementById('fcNome').value.trim();
  if(!nome){showToast('Nome obrigatório!','error');return;}
  const data={nome,icone:document.getElementById('fcIcone').value||'🔧',descricao:document.getElementById('fcDesc').value};
  if(id){
    const i=adminData.categories.findIndex(c=>c.id===id);
    if(i!==-1) adminData.categories[i]={...adminData.categories[i],...data};
    await dbOp('categorias','update',data,'id',id);
  } else {
    adminData.categories.push({id:'cat'+Date.now(),...data});
    await dbOp('categorias','insert',data);
  }
  saveLocal(); document.getElementById('adminModal').classList.remove('active');
  renderAdminCategories(); renderDashboard(); populateCategorySelects();
  showToast('Categoria guardada!','success');
}

async function deleteCategory(id) {
  if(adminData.products.some(p=>p.categoria_id===id)){showToast('Categoria em uso!','error');return;}
  if(!confirm('Apagar categoria?')) return;
  adminData.categories=adminData.categories.filter(c=>c.id!==id);
  await dbOp('categorias','delete',null,'id',id);
  saveLocal(); renderAdminCategories();
  showToast('Categoria apagada!','success');
}

// ============================================================
// SALES
// ============================================================
function openSaleForm() {
  document.getElementById('modalTitle').textContent='Registar Venda';
  const opts=adminData.products.map(p=>`<option value="${p.id}" data-price="${p.preco}" data-unit="${p.unidade||'un'}">${p.nome} — ${fmz(p.preco)} MT</option>`).join('');
  document.getElementById('adminModalContent').innerHTML=`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Cliente</label><input class="form-input" id="sCliente" placeholder="Nome do cliente" /></div>
      <div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="sTel" placeholder="+258 84..." /></div>
      <div class="form-group"><label class="form-label">Método de Pagamento</label>
        <select class="form-select" id="sMetodo">
          <option value="dinheiro">💵 Dinheiro</option>
          <option value="mpesa">📱 M-Pesa</option>
          <option value="emola">📱 E-Mola</option>
          <option value="transferencia">🏦 Transferência</option>
          <option value="credito">📋 A Crédito</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" id="sStatus"><option value="concluida">Concluída</option><option value="pendente">Pendente</option></select>
      </div>
      <div class="form-group full"><label class="form-label">Observações</label><textarea class="form-textarea" id="sObs" placeholder="Notas..."></textarea></div>
    </div>
    <div style="margin-top:1rem">
      <label class="form-label">Itens da Venda</label>
      <div id="saleItems" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem"></div>
      <button class="btn-sm btn-edit" style="margin-top:.5rem" onclick="addSaleItem()">+ Adicionar Item</button>
    </div>
    <div style="margin-top:1rem;text-align:right">
      <strong style="font-family:var(--font-display);font-size:1.5rem;color:var(--orange)">Total: <span id="saleTotal">0,00 MT</span></strong>
    </div>
    <div class="form-footer">
      <button class="btn-clear" onclick="document.getElementById('adminModal').classList.remove('active')">Cancelar</button>
      <button class="btn-orange" onclick="saveSale()">💾 Registar Venda</button>
    </div>`;
  document.getElementById('adminModal').classList.add('active');
  window._saleItemIdx=0;
  addSaleItem();
}

function addSaleItem() {
  window._saleItemIdx = (window._saleItemIdx||0)+1;
  const sid='si_'+window._saleItemIdx;
  // Only show active products with stock info
  const opts = adminData.products
    .filter(p => p.ativo !== false)
    .map(p => {
      const stock = p.quantidade || 0;
      const label = `${p.nome} — ${fmz(p.preco)} MT (stock: ${stock} ${p.unidade||'un'})`;
      return `<option value="${p.id}" data-price="${p.preco}" data-stock="${stock}" data-unit="${p.unidade||'un'}" ${stock===0?'style="color:#f87171"':''}>${label}</option>`;
    }).join('');

  const div=document.createElement('div');
  div.id=sid;
  div.style.cssText='display:grid;grid-template-columns:1fr 90px auto auto;gap:.5rem;align-items:start;background:var(--black-3);padding:.75rem;border-radius:6px;border:1px solid rgba(255,255,255,.05)';
  div.innerHTML=`
    <div>
      <select class="form-select" style="width:100%" onchange="onSaleItemChange('${sid}')">${opts}</select>
      <div class="sale-item-stock-info" id="stock_${sid}" style="font-size:.75rem;margin-top:.3rem;color:var(--gray-light)"></div>
    </div>
    <div>
      <input class="form-input" type="number" value="1" min="1" style="width:100%;text-align:center" id="qty_${sid}" oninput="updateSaleTotal()" />
      <div class="sale-qty-warn" id="warn_${sid}" style="font-size:.7rem;color:#f87171;margin-top:.2rem;display:none">⚠ Excede stock!</div>
    </div>
    <span style="color:var(--orange);font-family:var(--font-head);white-space:nowrap;padding-top:.75rem;min-width:100px;text-align:right" class="isub">0 MT</span>
    <button class="btn-sm btn-del" style="margin-top:.4rem" onclick="document.getElementById('${sid}').remove();updateSaleTotal()">✕</button>`;
  document.getElementById('saleItems').appendChild(div);
  onSaleItemChange(sid);
}

function onSaleItemChange(sid) {
  const row = document.getElementById(sid); if(!row) return;
  const sel  = row.querySelector('select');
  const opt  = sel.selectedOptions[0];
  const stock= parseInt(opt?.dataset.stock||0);
  const unit = opt?.dataset.unit||'un';
  const infoEl = document.getElementById('stock_'+sid);
  if (infoEl) {
    infoEl.textContent = stock > 0 ? `✓ Disponível: ${stock} ${unit}` : '✕ Sem stock';
    infoEl.style.color = stock > 0 ? '#4ade80' : '#f87171';
  }
  updateSaleTotal();
}

function updateSaleTotal() {
  let total=0;
  document.querySelectorAll('#saleItems>div').forEach(row=>{
    const sel  = row.querySelector('select'); if(!sel) return;
    const opt  = sel.selectedOptions[0];
    const qty  = parseFloat(row.querySelector('input[type="number"]')?.value)||0;
    const price= parseFloat(opt?.dataset.price||0);
    const stock= parseInt(opt?.dataset.stock||9999);
    const sub  = price*qty; total+=sub;
    const el   = row.querySelector('.isub'); if(el) el.textContent=fmz(sub)+' MT';
    // warn if exceeds stock
    const warnId = row.id ? 'warn_'+row.id : null;
    if (warnId) {
      const warnEl = document.getElementById(warnId);
      if (warnEl) warnEl.style.display = (qty > stock && stock > 0) ? 'block' : 'none';
    }
  });
  document.getElementById('saleTotal').textContent=fmz(total)+' MT';
}

async function saveSale() {
  const items=[];
  document.querySelectorAll('#saleItems>div').forEach(row=>{
    const sel=row.querySelector('select'); if(!sel) return;
    const qty=parseInt(row.querySelector('input[type="number"]')?.value)||0;
    const prodId=sel.value;
    const price=parseFloat(sel.selectedOptions[0]?.dataset.price||0);
    if(prodId&&qty>0){
      const p=adminData.products.find(x=>x.id===prodId);
      items.push({produto_id:prodId,produto_nome:p?.nome||'',quantidade:qty,preco_unitario:price,subtotal:price*qty});
    }
  });
  if(!items.length){showToast('Adicione pelo menos um item!','error');return;}
  const total=items.reduce((s,i)=>s+i.subtotal,0);
  const num='FL-'+Date.now().toString().slice(-8);
  const sale={id:'s'+Date.now(),numero_fatura:num,cliente_nome:document.getElementById('sCliente').value||'Balcão',
    cliente_telefone:document.getElementById('sTel').value,metodo_pagamento:document.getElementById('sMetodo').value,
    status:document.getElementById('sStatus').value,observacoes:document.getElementById('sObs').value,total,created_at:new Date().toISOString()};
  adminData.sales.unshift(sale);
  items.forEach(item=>{
    const p=adminData.products.find(x=>x.id===item.produto_id);
    if(p){ p.quantidade=Math.max(0,p.quantidade-item.quantidade);
      if(p.quantidade<=p.quantidade_minima) addNotification('stock',`⚠️ Stock Baixo: ${p.nome}`,`Apenas ${p.quantidade} unidades (mín:${p.quantidade_minima})`); }
  });
  try{
    if(window.db&&currentUser){
      const {data:sd}=await window.db.from('vendas').insert({numero_fatura:sale.numero_fatura,cliente_nome:sale.cliente_nome,
        cliente_telefone:sale.cliente_telefone,metodo_pagamento:sale.metodo_pagamento,status:sale.status,
        observacoes:sale.observacoes,total:sale.total}).select().single();
      if(sd) await window.db.from('venda_itens').insert(items.map(i=>({...i,venda_id:sd.id})));
      await Promise.all(adminData.products.map(p=>window.db.from('produtos').update({quantidade:p.quantidade}).eq('id',p.id)));
    }
  } catch(e){console.warn(e);}
  saveLocal();
  addNotification('sale',`🧾 Venda Registada: ${num}`,`Total: ${fmz(total)} MT · ${sale.cliente_nome}`);
  document.getElementById('adminModal').classList.remove('active');
  renderSales(); renderDashboard(); renderAdminProducts();
  showToast(`Venda ${num} registada!`,'success');
}

function renderSales() {
  const df=document.getElementById('salesDateFilter')?.value;
  let list=adminData.sales;
  if(df) list=list.filter(s=>s.created_at?.startsWith(df));
  document.getElementById('salesBody').innerHTML=list.map(s=>`<tr>
    <td><strong style="color:var(--orange)">${s.numero_fatura}</strong></td>
    <td>${s.cliente_nome||'Balcão'}<br/><small style="color:var(--gray-light)">${s.cliente_telefone||''}</small></td>
    <td style="color:var(--orange);font-family:var(--font-head);font-weight:700">${fmz(s.total)} MT</td>
    <td>${fdt(s.created_at)}</td>
    <td><small>${s.metodo_pagamento||'—'}</small></td>
    <td><span class="badge ${s.status==='concluida'?'badge-paid':'badge-pending'}">${s.status}</span></td>
    <td><div class="table-actions"><button class="btn-sm btn-edit" onclick="generateSalePDF('${s.id}')">📄 PDF</button><button class="btn-sm btn-del" onclick="deleteSale('${s.id}')">🗑</button></div></td>
  </tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-light)">Sem vendas</td></tr>';
}

async function deleteSale(id) {
  if(!confirm('Apagar venda?')) return;
  adminData.sales=adminData.sales.filter(s=>s.id!==id);
  await dbOp('vendas','delete',null,'id',id);
  saveLocal(); renderSales(); renderDashboard();
  showToast('Venda apagada!','success');
}

function generateSalePDF(id) {
  const s=adminData.sales.find(x=>x.id===id);
  if(!s){showToast('Venda não encontrada','error');return;}
  generateInvoicePDF(s,[]);
}

// ============================================================
// STOCK / PURCHASES
// ============================================================
function openPurchaseForm() {
  document.getElementById('modalTitle').textContent='Registar Entrada de Stock';
  const opts=adminData.products.map(p=>`<option value="${p.id}">${p.nome} (stock: ${p.quantidade})</option>`).join('');
  document.getElementById('adminModalContent').innerHTML=`
    <div class="form-grid">
      <div class="form-group full"><label class="form-label">Produto *</label><select class="form-select" id="puProd">${opts}</select></div>
      <div class="form-group"><label class="form-label">Quantidade Recebida *</label><input class="form-input" id="puQty" type="number" value="1" min="1" /></div>
      <div class="form-group"><label class="form-label">Preço de Custo (MT)</label><input class="form-input" id="puCusto" type="number" placeholder="0.00" /></div>
      <div class="form-group full"><label class="form-label">Fornecedor</label><input class="form-input" id="puForn" placeholder="Nome do fornecedor" /></div>
      <div class="form-group full"><label class="form-label">Observações</label><textarea class="form-textarea" id="puObs"></textarea></div>
    </div>
    <div class="form-footer">
      <button class="btn-clear" onclick="document.getElementById('adminModal').classList.remove('active')">Cancelar</button>
      <button class="btn-orange" onclick="savePurchase()">💾 Registar Entrada</button>
    </div>`;
  document.getElementById('adminModal').classList.add('active');
}

async function savePurchase() {
  const prodId=document.getElementById('puProd').value;
  const qty=parseInt(document.getElementById('puQty').value);
  if(!prodId||!qty){showToast('Preencha os campos!','error');return;}
  const p=adminData.products.find(x=>x.id===prodId);
  const pu={id:'pu'+Date.now(),produto_id:prodId,produto_nome:p?.nome||'',quantidade:qty,
    preco_custo:parseFloat(document.getElementById('puCusto').value)||null,
    fornecedor:document.getElementById('puForn').value,observacoes:document.getElementById('puObs').value,
    created_at:new Date().toISOString()};
  adminData.purchases.unshift(pu);
  if(p) p.quantidade+=qty;
  try{
    if(window.db&&currentUser){
      await window.db.from('compras').insert(pu);
      await window.db.from('produtos').update({quantidade:p.quantidade}).eq('id',prodId);
    }
  }catch(e){console.warn(e);}
  saveLocal(); document.getElementById('adminModal').classList.remove('active');
  renderPurchases(); renderAdminProducts(); renderDashboard();
  showToast(`+${qty} unidades adicionadas a "${p?.nome}"`,'success');
}

function renderPurchases() {
  document.getElementById('stockBody').innerHTML=adminData.purchases.map(pu=>`<tr>
    <td><strong style="color:var(--white)">${pu.produto_nome}</strong></td>
    <td style="color:#4ade80;font-family:var(--font-head);font-weight:700">+${pu.quantidade}</td>
    <td>${pu.fornecedor||'—'}</td>
    <td>${pu.preco_custo?fmz(pu.preco_custo)+' MT':'—'}</td>
    <td>${fdt(pu.created_at)}</td>
  </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-light)">Sem entradas</td></tr>';
}

// ============================================================
// DEBTS
// ============================================================
function openDebtForm(tipo) {
  document.getElementById('modalTitle').textContent=tipo==='a_receber'?'💚 Nova Dívida a Receber':'🔴 Nova Dívida a Pagar';
  document.getElementById('adminModalContent').innerHTML=`
    <div class="form-grid">
      <div class="form-group full"><label class="form-label">Nome do Contacto *</label><input class="form-input" id="dNome" placeholder="Nome do cliente ou fornecedor" /></div>
      <div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="dTel" placeholder="+258 84..." /></div>
      <div class="form-group"><label class="form-label">Valor (MT) *</label><input class="form-input" id="dValor" type="number" placeholder="0.00" /></div>
      <div class="form-group"><label class="form-label">Data de Vencimento</label><input class="form-input" id="dVenc" type="date" /></div>
      <div class="form-group"><label class="form-label">Notificar ao vencer?</label><select class="form-select" id="dNotif"><option value="1">Sim</option><option value="0">Não</option></select></div>
      <div class="form-group full"><label class="form-label">Descrição</label><textarea class="form-textarea" id="dDesc" placeholder="Descrição da dívida..."></textarea></div>
    </div>
    <div class="form-footer">
      <button class="btn-clear" onclick="document.getElementById('adminModal').classList.remove('active')">Cancelar</button>
      <button class="${tipo==='a_receber'?'btn-orange':'btn-gold'}" onclick="saveDebt('${tipo}')">💾 Registar</button>
    </div>`;
  document.getElementById('adminModal').classList.add('active');
}

async function saveDebt(tipo) {
  const nome=document.getElementById('dNome').value.trim();
  const valor=parseFloat(document.getElementById('dValor').value);
  if(!nome||!valor){showToast('Preencha os campos obrigatórios!','error');return;}
  const d={id:'d'+Date.now(),tipo,nome_contato:nome,telefone:document.getElementById('dTel').value,
    descricao:document.getElementById('dDesc').value,valor,valor_pago:0,
    data_vencimento:document.getElementById('dVenc').value||null,
    notificar:document.getElementById('dNotif').value==='1',status:'pendente',created_at:new Date().toISOString()};
  adminData.debts.unshift(d);
  await dbOp('dividas','insert',d);
  saveLocal(); document.getElementById('adminModal').classList.remove('active');
  renderDebts(); renderDashboard();
  showToast('Dívida registada!','success');
}

function openPaymentForm(id) {
  const d=adminData.debts.find(x=>x.id===id); if(!d) return;
  const rem=parseFloat(d.valor)-parseFloat(d.valor_pago||0);
  document.getElementById('modalTitle').textContent='Registar Pagamento';
  document.getElementById('adminModalContent').innerHTML=`
    <div style="margin-bottom:1.5rem;display:grid;gap:.5rem">
      <div class="list-item"><span class="item-name">Contacto</span><strong>${d.nome_contato}</strong></div>
      <div class="list-item"><span class="item-name">Total</span><span class="item-val">${fmz(d.valor)} MT</span></div>
      <div class="list-item"><span class="item-name">Já pago</span><span class="item-val green">${fmz(d.valor_pago||0)} MT</span></div>
      <div class="list-item"><span class="item-name">Restante</span><span class="item-val red">${fmz(rem)} MT</span></div>
    </div>
    <div class="form-group"><label class="form-label">Valor a registar (MT)</label><input class="form-input" id="payVal" type="number" value="${rem}" max="${rem}" /></div>
    <div class="form-footer">
      <button class="btn-clear" onclick="document.getElementById('adminModal').classList.remove('active')">Cancelar</button>
      <button class="btn-orange" onclick="registerPayment('${id}')">✓ Confirmar Pagamento</button>
    </div>`;
  document.getElementById('adminModal').classList.add('active');
}

async function registerPayment(id) {
  const amount=parseFloat(document.getElementById('payVal').value);
  const d=adminData.debts.find(x=>x.id===id); if(!d||!amount) return;
  d.valor_pago=Math.min(parseFloat(d.valor_pago||0)+amount,parseFloat(d.valor));
  d.status=d.valor_pago>=d.valor?'pago':'parcial';
  await dbOp('dividas','update',{valor_pago:d.valor_pago,status:d.status},'id',id);
  saveLocal(); document.getElementById('adminModal').classList.remove('active');
  renderDebts(); renderDashboard();
  showToast(`Pagamento de ${fmz(amount)} MT registado!`,'success');
}

function renderDebts() {
  const f=document.getElementById('debtFilter')?.value||'';
  let list=adminData.debts;
  if(f==='a_receber') list=list.filter(d=>d.tipo==='a_receber');
  else if(f==='a_pagar') list=list.filter(d=>d.tipo==='a_pagar');
  else if(f==='pendente') list=list.filter(d=>d.status!=='pago');
  else if(f==='pago') list=list.filter(d=>d.status==='pago');

  const recv=adminData.debts.filter(d=>d.tipo==='a_receber'&&d.status!=='pago').reduce((s,d)=>s+(d.valor-(d.valor_pago||0)),0);
  const pay=adminData.debts.filter(d=>d.tipo==='a_pagar'&&d.status!=='pago').reduce((s,d)=>s+(d.valor-(d.valor_pago||0)),0);
  const net=recv-pay;
  document.getElementById('debtsSummary').innerHTML=`
    <div class="debt-summary-card"><h4>↑ A Receber</h4><div class="amount green">${fmz(recv)} MT</div></div>
    <div class="debt-summary-card"><h4>↓ A Pagar</h4><div class="amount red">${fmz(pay)} MT</div></div>
    <div class="debt-summary-card"><h4>Saldo Líquido</h4><div class="amount ${net>=0?'green':'red'}">${fmz(net)} MT</div></div>`;

  document.getElementById('debtsBody').innerHTML=list.map(d=>{
    const rem=parseFloat(d.valor)-parseFloat(d.valor_pago||0);
    const ov=d.data_vencimento&&new Date(d.data_vencimento)<new Date()&&d.status!=='pago';
    return `<tr ${ov?'style="background:rgba(229,62,62,.05)"':''}>
      <td><span class="badge ${d.tipo==='a_receber'?'badge-recv':'badge-pay'}">${d.tipo==='a_receber'?'↑ Receber':'↓ Pagar'}</span></td>
      <td><strong style="color:var(--white)">${d.nome_contato}</strong>${d.telefone?`<br/><small style="color:var(--gray-light)">${d.telefone}</small>`:''}</td>
      <td style="color:var(--gray-light);max-width:180px">${d.descricao||'—'}</td>
      <td style="color:var(--orange);font-family:var(--font-head);font-weight:700">${fmz(d.valor)} MT</td>
      <td style="color:#4ade80;font-family:var(--font-head)">${fmz(d.valor_pago||0)} MT</td>
      <td style="color:${ov?'#f87171':'var(--white-dim)'}">${d.data_vencimento||'—'}${ov?' ⚠':''}</td>
      <td><span class="badge ${d.status==='pago'?'badge-paid':d.status==='parcial'?'badge-warn':'badge-pending'}">${d.status}</span></td>
      <td><div class="table-actions">${d.status!=='pago'?`<button class="btn-sm btn-pay" onclick="openPaymentForm('${d.id}')">💳 Pagar</button>`:''}<button class="btn-sm btn-del" onclick="deleteDebt('${d.id}')">🗑</button></div></td>
    </tr>`;
  }).join('')||'<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-light)">Sem dívidas</td></tr>';
}

async function deleteDebt(id) {
  if(!confirm('Apagar dívida?')) return;
  adminData.debts=adminData.debts.filter(d=>d.id!==id);
  await dbOp('dividas','delete',null,'id',id);
  saveLocal(); renderDebts(); renderDashboard();
  showToast('Dívida apagada!','success');
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function addNotification(tipo,titulo,mensagem) {
  const n={id:'n'+Date.now(),tipo,titulo,mensagem,lida:false,created_at:new Date().toISOString()};
  adminData.notifications.unshift(n);
  try{if(window.db&&currentUser) window.db.from('notificacoes').insert(n);}catch{}
  saveLocal(); updateNotifBadge();
}
function updateNotifBadge() {
  const u=adminData.notifications.filter(n=>!n.lida).length;
  document.getElementById('notifBadge').textContent=u;
  document.getElementById('notifBadge').style.display=u?'flex':'none';
  document.getElementById('topNotifCount').textContent=u;
}
function renderNotifications() {
  const list=document.getElementById('notificationsList');
  if(!adminData.notifications.length){
    list.innerHTML='<div style="text-align:center;padding:4rem;color:var(--gray-light)"><span style="font-size:3rem">🔔</span><p style="margin-top:1rem">Sem notificações</p></div>';
    return;
  }
  list.innerHTML=adminData.notifications.map(n=>`
    <div class="notif-item ${n.lida?'read':'unread'} type-${n.tipo}">
      <div class="notif-icon">${n.tipo==='stock'?'⚠️':n.tipo==='debt'?'💰':'🧾'}</div>
      <div class="notif-body"><div class="notif-title">${n.titulo}</div><div class="notif-msg">${n.mensagem}</div><div class="notif-time">${fdt(n.created_at)}</div></div>
      <div class="notif-actions">
        ${!n.lida?`<button class="btn-sm btn-edit" onclick="markRead('${n.id}')">✓ Lida</button>`:''}
        <button class="btn-sm btn-del" onclick="deleteNotif('${n.id}')">🗑</button>
      </div>
    </div>`).join('');
}
function markRead(id){const n=adminData.notifications.find(x=>x.id===id);if(n)n.lida=true;try{if(window.db&&currentUser)window.db.from('notificacoes').update({lida:true}).eq('id',id);}catch{}saveLocal();updateNotifBadge();renderNotifications();}
function markAllRead(){adminData.notifications.forEach(n=>n.lida=true);try{if(window.db&&currentUser)window.db.from('notificacoes').update({lida:true});}catch{}saveLocal();updateNotifBadge();renderNotifications();}
function deleteNotif(id){adminData.notifications=adminData.notifications.filter(n=>n.id!==id);saveLocal();updateNotifBadge();renderNotifications();}
function clearAllNotifications(){if(!confirm('Apagar todas?'))return;adminData.notifications=[];saveLocal();updateNotifBadge();renderNotifications();}

// ============================================================
// AUTO-CHECKS
// ============================================================
function checkLowStock() {
  adminData.products.forEach(p=>{
    if(p.quantidade<=p.quantidade_minima){
      const exists=adminData.notifications.some(n=>n.titulo.includes(p.nome)&&!n.lida&&n.tipo==='stock');
      if(!exists) addNotification('stock',`⚠️ Stock Baixo: ${p.nome}`,`Apenas ${p.quantidade} ${p.unidade||'un'} (mín:${p.quantidade_minima})`);
    }
  });
  renderDashboard();
  showToast('Verificação de stock concluída!','success');
}
function checkDebtAlerts() {
  const today=new Date();
  adminData.debts.forEach(d=>{
    if(d.notificar&&d.data_vencimento&&d.status!=='pago'){
      const diff=Math.ceil((new Date(d.data_vencimento)-today)/(1000*60*60*24));
      if(diff<=3&&diff>=0){
        const exists=adminData.notifications.some(n=>n.titulo.includes(d.nome_contato)&&n.tipo==='debt'&&!n.lida);
        if(!exists) addNotification('debt',`💰 Vencimento Próximo: ${d.nome_contato}`,`Dívida de ${fmz(d.valor)} MT vence ${diff===0?'hoje':diff+' dia(s)'}`);
      }
    }
  });
}
function populateCategorySelects() {
  const s=document.getElementById('prodCatFilter'); if(!s) return;
  s.innerHTML='<option value="">Todas as categorias</option>'+adminData.categories.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
}

// ============================================================
// UTILS
// ============================================================
function fmz(v){return parseFloat(v||0).toLocaleString('pt-MZ',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fdt(dt){if(!dt)return'—';return new Date(dt).toLocaleDateString('pt-MZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function showToast(msg,type='info'){let c=document.querySelector('.toast-container');if(!c){c=document.createElement('div');c.className='toast-container';document.body.appendChild(c);}const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),3200);}
function closeAdminModal(e){if(e.target===document.getElementById('adminModal'))document.getElementById('adminModal').classList.remove('active');}
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('adminModal').classList.remove('active');});

// ============================================================
// MOBILE SIDEBAR
// ============================================================
function toggleMobileSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('sidebarOverlay');
  const btn = document.querySelector('.mobile-sidebar-btn');
  sb?.classList.toggle('mobile-open');
  ov?.classList.toggle('active');
  if (btn) btn.textContent = sb?.classList.contains('mobile-open') ? '✕' : '☰';
}
// Show mobile sidebar button on small screens
window.addEventListener('resize', () => {
  const btn = document.querySelector('.mobile-sidebar-btn');
  if (btn) btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
});
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.mobile-sidebar-btn');
  if (btn && window.innerWidth <= 768) btn.style.display = 'flex';
});
