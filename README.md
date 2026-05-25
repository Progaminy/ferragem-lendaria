# ⚙ FERRAGEM LENDÁRIA — Guia de Configuração

## Estrutura de Ficheiros

```
ferragem-lendaria/
├── index.html              ← Loja pública (clientes)
├── pages/
│   └── admin.html          ← Painel Admin (protegido)
├── css/
│   ├── style.css           ← Estilos gerais
│   └── admin.css           ← Estilos do admin
├── js/
│   ├── supabase-config.js  ← Configuração da BD + schema SQL
│   ├── store.js            ← Lógica da loja pública
│   └── admin.js            ← Lógica do painel admin
└── README.md
```

---

## 🚀 PASSO 1 — Criar Projecto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **New Project**
3. Defina nome, senha e região (escolha a mais próxima)
4. Aguarde o projecto inicializar (~2 min)

---

## 🔑 PASSO 2 — Obter Credenciais

1. No painel Supabase, clique em **Settings → API**
2. Copie:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → chave longa começando por `eyJ...`

---

## ✏️ PASSO 3 — Configurar os Ficheiros

### Em `pages/admin.html` (linha com `SUPA_URL` e `SUPA_KEY`):
```javascript
const SUPA_URL = 'https://SEU_PROJECT_ID.supabase.co'; // ← cole aqui
const SUPA_KEY = 'SUA_ANON_KEY_AQUI';                 // ← cole aqui
```

### Em `index.html` (script no final do body):
```javascript
const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';
```

---

## 🗄️ PASSO 4 — Criar as Tabelas na Base de Dados

1. No painel Supabase, vá em **SQL Editor → New Query**
2. Abra o ficheiro `js/supabase-config.js`
3. Copie todo o SQL que está dentro do comentário `/* ... */`
4. Cole no SQL Editor e clique em **Run**

---

## 👤 PASSO 5 — Criar o Utilizador Admin

1. No painel Supabase, vá em **Authentication → Users**
2. Clique em **Add User → Create New User**
3. Preencha:
   - **Email:** `admin@ferragemlendaria.co.mz` (ou o que preferir)
   - **Password:** (defina uma senha segura, mínimo 8 caracteres)
4. Clique em **Create User**
5. Use essas credenciais para entrar no painel Admin

---

## 📞 PASSO 6 — Actualizar Contactos

Em `index.html`, procure por `+258 84 000 0000` e substitua pelo número real.

Procure por `geral@ferragemlendaria.co.mz` e substitua pelo email real.

No link do WhatsApp, substitua o número:
```html
<a href="https://wa.me/258840000000" ...>
```
Formato: `258` + número sem o `0` inicial. Ex: `84 123 4567` → `https://wa.me/258841234567`

---

## 🌐 PASSO 7 — Abrir no Browser

Simplesmente abra o ficheiro `index.html` no browser.

Para o Admin: abra `pages/admin.html`.

> ⚠️ **Nota:** Para funcionar com Supabase, os ficheiros precisam de ser servidos por um servidor HTTP (não apenas abertos como ficheiro). Use:
> - **VS Code:** extensão **Live Server** (botão direito → Open with Live Server)
> - **Ou:** `npx serve .` na pasta do projecto

---

## 🔐 Segurança

- O painel Admin é protegido por **Supabase Auth** (email + senha)
- As tabelas sensíveis têm **Row Level Security (RLS)** activada
- Dados de clientes (carrinho) ficam apenas no `localStorage` do browser

---

## 📱 Funcionalidades

### Loja Pública (index.html)
- ✅ Carrossel animado com 4 slides
- ✅ 12 categorias expansíveis
- ✅ Catálogo de produtos com pesquisa e filtros
- ✅ Carrinho lateral com controlo de quantidade
- ✅ Geração de Fatura em PDF
- ✅ Botões de contacto (WhatsApp, Tel, Email)

### Painel Admin (pages/admin.html)
- ✅ Login seguro via Supabase Auth
- ✅ Recuperação de senha por email
- ✅ Dashboard com estatísticas em tempo real
- ✅ CRUD completo de Produtos e Categorias
- ✅ Controlo de stock com alerta visual
- ✅ Registo de Vendas com subtracção automática de stock
- ✅ Registo de Compras / Entradas de stock
- ✅ Gestão de Dívidas (a receber e a pagar) com pagamentos parciais
- ✅ Sistema de Notificações internas (stock baixo, vencimentos)
- ✅ Geração de PDF de Fatura

---

## 🔮 Próximas Funcionalidades (Escalável)

- [ ] Pagamentos M-Pesa / E-Mola integrados
- [ ] App móvel (React Native / Flutter)
- [ ] Relatórios e gráficos de vendas
- [ ] Multi-utilizador com papéis (admin, vendedor, caixa)
- [ ] Código de barras / QR Code nos produtos
- [ ] Encomendas online com entrega
