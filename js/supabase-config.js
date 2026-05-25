// ============================================================
// SUPABASE CONFIGURATION - Ferragem Lendária
// ============================================================
// INSTRUÇÕES DE SETUP:
// 1. Acesse https://app.supabase.com e crie um projecto
// 2. Vá em Settings -> API
// 3. Copie o "Project URL" e a "anon public" key
// 4. Cole abaixo substituindo os valores

const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH HELPERS
// ============================================================
const Auth = {
  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  },
  async getSession() {
    const { data } = await db.auth.getSession();
    return data.session;
  },
  onAuthChange(callback) {
    return db.auth.onAuthStateChange(callback);
  }
};

// ============================================================
// SQL SCHEMA — Execute no Supabase SQL Editor (uma única vez)
// ============================================================
/*

-- ===== TABELA: categorias =====
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  icone TEXT DEFAULT '🔧',
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: produtos =====
CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 5,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  imagem_url TEXT,
  unidade TEXT DEFAULT 'un',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: vendas =====
CREATE TABLE vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_fatura TEXT UNIQUE NOT NULL,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  total DECIMAL(10,2) NOT NULL,
  metodo_pagamento TEXT DEFAULT 'dinheiro',
  status TEXT DEFAULT 'concluida',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: venda_itens =====
CREATE TABLE venda_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- ===== TABELA: compras =====
CREATE TABLE compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_custo DECIMAL(10,2),
  fornecedor TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: dividas =====
CREATE TABLE dividas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('a_receber', 'a_pagar')),
  nome_contato TEXT NOT NULL,
  telefone TEXT,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  data_vencimento DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago')),
  notificar BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: notificacoes =====
CREATE TABLE notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  referencia_id UUID,
  referencia_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Loja pública: leitura de produtos e categorias activos
CREATE POLICY "produtos_public_read" ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "categorias_public_read" ON categorias FOR SELECT USING (true);

-- Admin autenticado: acesso total a tudo
CREATE POLICY "admin_produtos_all" ON produtos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_categorias_all" ON categorias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_vendas_all" ON vendas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_venda_itens_all" ON venda_itens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_compras_all" ON compras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_dividas_all" ON dividas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_notificacoes_all" ON notificacoes FOR ALL USING (auth.role() = 'authenticated');

-- ===== DADOS INICIAIS: Categorias =====
INSERT INTO categorias (nome, icone, descricao) VALUES
  ('Ferramentas Manuais','🔨','Martelos, chaves, alicates, serrotes e mais'),
  ('Ferramentas Elétricas','⚡','Furadeiras, serras, lixadeiras'),
  ('Parafusos e Fixadores','🔩','Parafusos, porcas, pregos, rebites'),
  ('Tubagens e Conexões','🔧','Canos, joelhos, torneiras, válvulas'),
  ('Tintas e Acabamentos','🎨','Tintas, vernizes, primers, pincéis'),
  ('Elétrica','💡','Cabos, tomadas, interruptores, disjuntores'),
  ('Cimento e Argamassa','🏗️','Cimento, areia, blocos e materiais de construção'),
  ('Madeira e Derivados','🪵','Tábuas, compensados, MDF, portas'),
  ('Segurança e EPI','🦺','Capacetes, luvas, óculos, botas'),
  ('Jardinagem','🌿','Enxadas, pás, mangueiras, sementes'),
  ('Hidráulica','💧','Bombas, caixas d''água, filtros'),
  ('Portões e Grades','🚪','Portões, grades, fechaduras, dobradiças');

-- ===== CRIAR UTILIZADOR ADMIN =====
-- No painel Supabase: Authentication -> Users -> Add User
-- Email: admin@ferragemlendaria.co.mz
-- Password: (defina uma senha segura)

*/

export { db, Auth };
