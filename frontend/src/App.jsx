import { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpFromLine,
  Boxes, BriefcaseBusiness, Check, ChevronDown, CircleHelp, ClipboardList, Download,
  LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Search, Settings2, ShoppingBag,
  Store, Trash2, Truck, Users, X
} from 'lucide-react';

const configuredApiUrl = import.meta.env.VITE_API_URL || 'https://backend-wer5.onrender.com';
const API_URL = import.meta.env.DEV
  ? '/api'
  : `${/^https?:\/\//i.test(configuredApiUrl) ? '' : 'https://'}${configuredApiUrl}`.replace(/\/$/, '');
const SESSION_STORAGE_KEY = 'loja-session';

function readStoredSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || 'null'); } catch { return null; }
}

const resources = {
  produtos: {
    title: 'Produtos', singular: 'produto', endpoint: '/produtos', table: 'produtos', id: 'id_produto', icon: Package,
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'descricao', label: 'Descrição', required: true },
      { name: 'preco', label: 'Preço de venda', type: 'number', step: '0.01' },
      { name: 'imagem_produto', label: 'URL da imagem', required: true }
    ], columns: ['nome', 'descricao', 'preco']
  },
  estoque: {
    title: 'Estoque', singular: 'registro de estoque', endpoint: '/estoque', table: 'estoque', id: 'id_estoque', icon: Boxes,
    fields: [
      { name: 'id_produto', label: 'ID do produto', type: 'number', required: true },
      { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { name: 'estoque_minimo', label: 'Estoque mínimo', type: 'number' },
      { name: 'estoque_maximo', label: 'Estoque máximo', type: 'number' },
      { name: 'localizacao', label: 'Localização' }
    ], columns: ['id_produto', 'quantidade', 'estoque_minimo', 'localizacao']
  },
  categorias: {
    title: 'Categorias', singular: 'categoria', endpoint: '/categorias', table: 'categorias', id: 'id_categoria', icon: ClipboardList,
    fields: [
      { name: 'nome', label: 'Nome', required: true }, { name: 'descricao', label: 'Descrição' },
      { name: 'ativo', label: 'Ativa', type: 'checkbox', defaultValue: true }
    ], columns: ['nome', 'descricao', 'ativo']
  },
  clientes: {
    title: 'Clientes', singular: 'cliente', endpoint: '/clientes', table: 'clientes', id: 'id_cliente', icon: Users,
    fields: [
      { name: 'nome', label: 'Nome completo', required: true }, { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'contato', label: 'Telefone' }, { name: 'ativo', label: 'Ativo', type: 'checkbox', defaultValue: true }
    ], columns: ['nome', 'email', 'contato', 'ativo']
  },
  fornecedores: {
    title: 'Fornecedores', singular: 'fornecedor', endpoint: '/fornecedores', table: 'fornecedores', id: 'id_fornecedor', icon: Truck,
    fields: [
      { name: 'nome', label: 'Contato', required: true }, { name: 'empresa', label: 'Empresa' },
      { name: 'email', label: 'E-mail', type: 'email' }, { name: 'telefone', label: 'Telefone' },
      { name: 'cidade', label: 'Cidade' }, { name: 'estado', label: 'UF' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox', defaultValue: true }
    ], columns: ['nome', 'empresa', 'email', 'cidade', 'ativo']
  },
  funcionarios: {
    title: 'Funcionários', singular: 'funcionário', endpoint: '/funcionarios', table: 'funcionarios', id: 'id_funcionario', icon: BriefcaseBusiness,
    fields: [
      { name: 'nome', label: 'Nome completo', required: true }, { name: 'cargo', label: 'Cargo', required: true },
      { name: 'salario', label: 'Salário', type: 'number', step: '0.01', required: true },
      { name: 'telefone', label: 'Telefone' }, { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'data_admissao', label: 'Data de admissão', type: 'date' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox', defaultValue: true }
    ], columns: ['nome', 'cargo', 'email', 'telefone', 'ativo']
  },
  entradas: {
    title: 'Entradas', singular: 'entrada', endpoint: '/entradas', table: 'entradas', id: 'id_entrada', icon: ArrowDownToLine,
    fields: [
      { name: 'id_produto', label: 'ID do produto', type: 'number', required: true },
      { name: 'id_fornecedor', label: 'ID do fornecedor', type: 'number', required: true },
      { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { name: 'valor_unitario', label: 'Valor unitário', type: 'number', step: '0.01', required: true },
      { name: 'data_entrada', label: 'Data', type: 'date' }, { name: 'observacao', label: 'Observação' }
    ], columns: ['id_produto', 'id_fornecedor', 'quantidade', 'valor_unitario', 'data_entrada']
  },
  saidas: {
    title: 'Saídas', singular: 'saída', endpoint: '/saidas', table: 'saidas', id: 'id_saida', icon: ArrowUpFromLine,
    fields: [
      { name: 'id_produto', label: 'ID do produto', type: 'number', required: true },
      { name: 'id_funcionario', label: 'ID do funcionário', type: 'number', required: true },
      { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { name: 'valor_unitario', label: 'Valor unitário', type: 'number', step: '0.01', required: true },
      { name: 'data_saida', label: 'Data', type: 'date' }, { name: 'destino', label: 'Destino' }
    ], columns: ['id_produto', 'id_funcionario', 'quantidade', 'valor_unitario', 'data_saida']
  },
  pedidos: {
    title: 'Pedidos', singular: 'pedido', endpoint: '/pedidos', table: 'pedidos', id: 'id_pedido', icon: ShoppingBag,
    fields: [
      { name: 'id_cliente', label: 'ID do cliente', type: 'number' }, { name: 'data_pedido', label: 'Data do pedido', type: 'date' },
      { name: 'status', label: 'Ativo', type: 'checkbox', defaultValue: true }
    ], columns: ['id_cliente', 'data_pedido', 'status']
  },
  pedido_itens: {
    title: 'Itens do pedido', singular: 'item do pedido', endpoint: '/pedido_itens', table: 'pedido_itens', id: 'id_item', icon: ClipboardList,
    fields: [
      { name: 'id_pedido', label: 'ID do pedido', type: 'number' }, { name: 'id_produto', label: 'ID do produto', type: 'number' },
      { name: 'quantidade', label: 'Quantidade', type: 'number' }, { name: 'valor_unitario', label: 'Valor unitário', type: 'number', step: '0.01' },
      { name: 'subtotal', label: 'Subtotal', type: 'number', step: '0.01' }
    ], columns: ['id_pedido', 'id_produto', 'quantidade', 'valor_unitario', 'subtotal']
  },
  historico_precos: {
    title: 'Histórico de preços', singular: 'histórico de preço', endpoint: '/historico_precos', table: 'historico_precos', id: 'id_historico', icon: Activity,
    fields: [
      { name: 'id_produto', label: 'ID do produto', type: 'number' }, { name: 'preco', label: 'Preço', type: 'number', step: '0.01' },
      { name: 'vigencia', label: 'Vigência', type: 'date' }
    ], columns: ['id_produto', 'preco', 'vigencia']
  },
  movimentacoes: {
    title: 'Movimentações', singular: 'movimentação', endpoint: '/movimentacoes', table: 'movimentacoes', id: 'id_movimentacao', icon: Activity,
    fields: [
      { name: 'id_produto', label: 'ID do produto', type: 'number' }, { name: 'tipo', label: 'Tipo (E, S, A, P ou T)' },
      { name: 'quantidade', label: 'Quantidade', type: 'number' }, { name: 'data_movimentacao', label: 'Data e hora', type: 'datetime-local' },
      { name: 'observacao', label: 'Observação' }
    ], columns: ['id_produto', 'tipo', 'quantidade', 'data_movimentacao', 'observacao']
  },
  logs: {
    title: 'Logs', singular: 'log', endpoint: '/logs', table: 'logs', id: 'id_log', icon: ClipboardList,
    fields: [
      { name: 'usuario', label: 'Usuário' }, { name: 'tabela_afetada', label: 'Tabela afetada' }, { name: 'acao', label: 'Ação' },
      { name: 'registro', label: 'ID do registro', type: 'number' }, { name: 'data_hora', label: 'Data e hora', type: 'datetime-local' }
    ], columns: ['usuario', 'tabela_afetada', 'acao', 'registro', 'data_hora']
  },
  usuarios: {
    title: 'Usuários', singular: 'usuário', endpoint: '/usuarios', table: 'usuarios', id: 'id_usu', icon: Users,
    fields: [
      { name: 'nome', label: 'Nome', required: true }, { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'senha', label: 'Senha', type: 'password', required: true }, { name: 'contato', label: 'Contato' },
      { name: 'genero', label: 'Gênero' }, { name: 'ativo', label: 'Ativo', type: 'checkbox', defaultValue: true }
    ], columns: ['nome', 'email', 'contato', 'genero', 'ativo']
  }
};

const DASHBOARD_RESOURCE_KEYS = ['produtos', 'estoque', 'clientes', 'pedidos', 'entradas'];

const primaryNavigation = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'entradas', label: 'Entradas', icon: ArrowDownToLine },
  { id: 'saidas', label: 'Saídas', icon: ArrowUpFromLine },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag }
];

const directoryNavigation = [
  { id: 'clientes', label: 'Clientes' }, { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'funcionarios', label: 'Funcionários' }, { id: 'categorias', label: 'Categorias' },
  { id: 'pedido_itens', label: 'Itens do pedido' }, { id: 'historico_precos', label: 'Histórico de preços' },
  { id: 'movimentacoes', label: 'Movimentações' }, { id: 'logs', label: 'Logs' }, { id: 'usuarios', label: 'Usuários' }
];

function getErrorMessage(body, status) {
  return body?.mensagem || body?.erro?.mensagem || body?.error?.sqlMessage || body?.error?.message || `Falha na API (${status}).`;
}

async function request(path, options = {}) {
  let response;
  const session = readStoredSession();
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(session?.token && !path.endsWith('/login') ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error(`Não foi possível conectar à API em ${API_URL}.`);
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && session?.token) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event('loja-session-expired'));
  }
  if (!response.ok) throw new Error(getErrorMessage(body, response.status));
  return body;
}

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function humanize(value) {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await request('/login', { method: 'POST', body: JSON.stringify({ email, senha: password }) });
      onLogin(result.usuario, result.token);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-mark"><Store size={23} strokeWidth={2.2} /></div>
        <p className="eyebrow">LOJA OFICIAL <span>·</span> OPERAÇÃO</p>
        <h1>Bom ter você<br />por aqui.</h1>
        <p className="login-copy">Entre com seu usuário para acessar o painel da loja.</p>
        <form className="login-form" onSubmit={submit}>
          <label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary login-submit" disabled={busy}>{busy ? 'Validando...' : 'Entrar'}<ArrowRight size={17} /></button>
        </form>
        <p className="login-footnote"><CircleHelp size={15} /> Sessão protegida por token temporário. A conexão usa os dados da API da loja.</p>
      </section>
      <aside className="login-art" aria-label="Produtos da loja">
        <div className="art-caption"><span>CONTROLE DA LOJA</span><strong>Rotina em<br />dia, estoque<br />sob controle.</strong><small>PAINEL DE OPERAÇÕES&nbsp; / &nbsp;01</small></div>
        <div className="art-stamp"><Activity size={17} /> AO VIVO</div>
      </aside>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(readStoredSession);
  const user = session?.user || null;
  const [activePage, setActivePage] = useState('dashboard');
  const [rows, setRows] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (session?.token && session.user) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('loja-user');
  }, [session]);

  useEffect(() => {
    function expireSession() {
      setSession(null);
      setNotice('Sua sessão expirou. Entre novamente.');
    }
    window.addEventListener('loja-session-expired', expireSession);
    return () => window.removeEventListener('loja-session-expired', expireSession);
  }, []);

  useEffect(() => {
    if (!user || activePage === 'dashboard') return;
    loadResource(activePage);
  }, [activePage, user]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function focusSearch(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && activePage !== 'dashboard') {
        event.preventDefault();
        document.querySelector('.search-box input')?.focus();
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, [activePage]);

  async function loadResource(key) {
    const resource = resources[key];
    setLoading(true);
    setLoadError('');
    try {
      const result = await request(resource.endpoint);
      setRows(Array.isArray(result[resource.table]) ? result[resource.table] : []);
    } catch (error) {
      setRows([]);
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    setLoadError('');
    const entries = Object.entries(resources).filter(([key]) => DASHBOARD_RESOURCE_KEYS.includes(key));
    const results = await Promise.all(entries.map(async ([key, resource]) => {
      try {
        const body = await request(resource.endpoint);
        return [key, Array.isArray(body[resource.table]) ? body[resource.table] : []];
      } catch (error) {
        return [key, { error: error.message }];
      }
    }));
    const values = Object.fromEntries(results);
    setDashboard(values);
    const failed = Object.values(values).find((value) => !Array.isArray(value));
    setLoadError(failed?.error || '');
    setLoading(false);
  }

  useEffect(() => {
    if (user && activePage === 'dashboard') loadDashboard();
  }, [user, activePage]);

  function signIn(nextUser, token) {
    setSession({ user: nextUser, token });
    setActivePage('dashboard');
  }

  function signOut() {
    setSession(null);
    setRows([]);
    setDashboard({});
  }

  function openCreate() {
    setDialog({ mode: 'create', resource: activePage, record: null });
  }

  function openEdit(record) {
    setDialog({ mode: 'edit', resource: activePage, record });
  }

  async function saveRecord(values) {
    const resource = resources[dialog.resource];
    const editing = dialog.mode === 'edit';
    const id = editing ? dialog.record[resource.id] : null;
    const result = await request(editing ? `${resource.endpoint}/${id}` : resource.endpoint, {
      method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values)
    });
    setDialog(null);
    setNotice(result.mensagem || `${resource.singular} salvo com sucesso.`);
    await loadResource(dialog.resource);
    if (activePage === 'dashboard') await loadDashboard();
  }

  async function deleteRecord(record) {
    const resource = resources[activePage];
    if (!window.confirm(`Remover este ${resource.singular}? Esta ação não pode ser desfeita.`)) return;
    try {
      const result = await request(`${resource.endpoint}/${record[resource.id]}`, { method: 'DELETE' });
      setNotice(result.mensagem || 'Registro removido.');
      await loadResource(activePage);
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!user) return <Login onLogin={signIn} />;

  const currentResource = resources[activePage];
  const currentPageLabel = currentResource?.title || 'Visão geral';
  const filteredRows = rows.filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search.toLowerCase())));
  const products = Array.isArray(dashboard.produtos) ? dashboard.produtos : [];
  const inventory = Array.isArray(dashboard.estoque) ? dashboard.estoque : [];
  const customers = Array.isArray(dashboard.clientes) ? dashboard.clientes : [];
  const orders = Array.isArray(dashboard.pedidos) ? dashboard.pedidos : [];
  const lowStock = inventory.filter((item) => item.estoque_minimo != null && Number(item.quantidade) <= Number(item.estoque_minimo));
  const productById = Object.fromEntries(products.map((product) => [product.id_produto, product]));
  const inventoryWithProduct = [...inventory].sort((a, b) => Number(a.quantidade) - Number(b.quantidade)).slice(0, 5);
  const latestEntries = Array.isArray(dashboard.entradas) ? [...dashboard.entradas].sort((a, b) => String(b.data_entrada || '').localeCompare(String(a.data_entrada || ''))).slice(0, 4) : [];

  function choosePage(id) {
    setActivePage(id);
    setSearch('');
    setMobileNavOpen(false);
  }

  function renderCell(field, value) {
    if (field === 'preco' || field === 'valor_unitario' || field === 'salario') return formatCurrency(value);
    if (field === 'data_hora' || field === 'data_movimentacao') return formatDateTime(value);
    if (field.startsWith('data_') || field === 'vigencia') return formatDate(value);
    if (field === 'ativo' || field === 'status') return <span className={`status-pill ${Number(value) ? 'is-active' : 'is-inactive'}`}><i />{Number(value) ? 'Ativo' : 'Inativo'}</span>;
    if (field === 'id_produto' && productById[value]) return productById[value].nome || `Produto ${value}`;
    return value == null || value === '' ? '—' : String(value);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><span className="brand-mark small"><Store size={19} /></span><span>loja<span className="brand-dot">.</span><small>OFICIAL</small></span><button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Fechar navegação"><X size={19} /></button></div>
        <div className="workspace-switch"><span className="workspace-icon"><Store size={16} /></span><span><strong>Loja principal</strong><small>Unidade · Araguaína, TO</small></span><ChevronDown size={15} /></div>
        <nav className="side-nav" aria-label="Navegação principal">
          <span className="nav-caption">OPERAÇÃO</span>
          {primaryNavigation.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activePage === id ? 'selected' : ''}`} onClick={() => choosePage(id)}><Icon size={18} /><span>{label}</span>{id === 'estoque' && lowStock.length > 0 && <em>{lowStock.length}</em>}</button>)}
          <span className="nav-caption directory-caption">CADASTROS</span>
          {directoryNavigation.map(({ id, label }) => <button key={id} className={`nav-item ${activePage === id ? 'selected' : ''}`} onClick={() => choosePage(id)}><span className="nav-bullet" /><span>{label}</span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="api-note"><span className="api-note-icon"><Check size={16} /></span><div><strong>Sessão protegida</strong><small>Token temporário com expiração automática.</small></div></div>
          <button className="account-button" onClick={signOut}><span className="avatar">{(user.nome || user.email || 'U').slice(0, 1).toUpperCase()}</span><span className="account-info"><strong>{user.nome || 'Usuário'}</strong><small>{user.email}</small></span><LogOut size={17} /></button>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="Fechar navegação" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Abrir navegação"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Loja Oficial</span><span>/</span><strong>{currentPageLabel}</strong></div>
          <div className="topbar-actions"><span className="connection-indicator"><i /> API <span>·</span> {API_URL.replace(/^https?:\/\//, '')}</span><button className="icon-button" title="Atualizar dados" onClick={() => activePage === 'dashboard' ? loadDashboard() : loadResource(activePage)}><Activity size={18} /></button></div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR')} <span>·</span> OPERAÇÃO DA LOJA</p><h1>{activePage === 'dashboard' ? 'Visão geral' : currentPageLabel}</h1><p className="page-subtitle">{activePage === 'dashboard' ? 'Acompanhe o movimento e os pontos de atenção da sua loja.' : `Consulte e atualize ${currentPageLabel.toLowerCase()} da loja.`}</p></div>
            {currentResource && <button className="button button-primary" onClick={openCreate}><Plus size={17} /> Novo {currentResource.singular}</button>}
          </div>

          {loadError && <div className="alert-banner" role="status"><AlertTriangle size={17} /><span>{loadError}</span><button onClick={() => activePage === 'dashboard' ? loadDashboard() : loadResource(activePage)}>Tentar novamente</button></div>}

          {activePage === 'dashboard' ? (
            <DashboardView
              loading={loading} products={products} inventory={inventory} customers={customers} orders={orders}
              lowStock={lowStock} inventoryWithProduct={inventoryWithProduct} latestEntries={latestEntries}
              productById={productById} onNavigate={choosePage} onRefresh={loadDashboard} renderCell={renderCell}
            />
          ) : (
            <section className="table-section">
              <div className="table-toolbar"><div className="record-count"><strong>{rows.length}</strong> registros</div><label className="search-box"><Search size={17} /><input placeholder={`Buscar em ${currentPageLabel.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><button className="button button-quiet export-button" onClick={() => exportCsv(currentResource, filteredRows)}><Download size={16} /><span>Exportar</span></button></div>
              <div className="table-wrap">
                <table><thead><tr>{currentResource.columns.map((field) => <th key={field}>{humanize(field)}</th>)}<th className="actions-heading">Ações</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td className="table-state" colSpan={currentResource.columns.length + 1}>Carregando dados...</td></tr>
                      : filteredRows.length === 0 ? <tr><td className="table-state" colSpan={currentResource.columns.length + 1}>{loadError ? 'Não foi possível carregar os registros.' : search ? 'Nenhum resultado para esta busca.' : 'Ainda não há registros neste cadastro.'}</td></tr>
                        : filteredRows.map((row) => <tr key={row[currentResource.id]}>{currentResource.columns.map((field) => <td key={field} className={field === 'preco' || field === 'valor_unitario' ? 'numeric-cell' : ''}>{renderCell(field, row[field])}</td>)}<td className="row-actions"><button className="icon-button" title="Editar registro" onClick={() => openEdit(row)}><Pencil size={16} /></button><button className="icon-button danger-action" title="Remover registro" onClick={() => deleteRecord(row)}><Trash2 size={16} /></button></td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Exibindo {filteredRows.length} de {rows.length} registros</span><div className="pagination"><button disabled aria-label="Página anterior"><ArrowLeft size={15} /></button><span>1</span><button disabled aria-label="Próxima página"><ArrowRight size={15} /></button></div></div>
            </section>
          )}
          <footer className="page-footer"><span>LOJA OFICIAL <i /> PAINEL DE OPERAÇÕES</span><span>Dados conectados à API REST</span></footer>
        </div>
      </main>

      {dialog && <RecordDialog key={`${dialog.resource}-${dialog.mode}-${dialog.record?.[resources[dialog.resource].id] || 'new'}`} dialog={dialog} onClose={() => setDialog(null)} onSave={saveRecord} />}
      {notice && <div className="toast" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dispensar aviso"><X size={15} /></button></div>}
    </div>
  );
}

function DashboardView({ loading, products, inventory, customers, orders, lowStock, inventoryWithProduct, latestEntries, productById, onNavigate, onRefresh, renderCell }) {
  const inventoryValue = inventory.reduce((sum, item) => sum + Number(item.quantidade || 0) * Number(productById[item.id_produto]?.preco || 0), 0);
  const metrics = [
    { label: 'Produtos cadastrados', value: products.length, note: 'itens no catálogo', icon: Package, tone: 'green', page: 'produtos' },
    { label: 'Unidades em estoque', value: inventory.reduce((sum, row) => sum + Number(row.quantidade || 0), 0).toLocaleString('pt-BR'), note: `${lowStock.length} abaixo do mínimo`, icon: Boxes, tone: 'blue', page: 'estoque' },
    { label: 'Clientes ativos', value: customers.filter((row) => Number(row.ativo) === 1).length, note: `${customers.length} no cadastro`, icon: Users, tone: 'orange', page: 'clientes' },
    { label: 'Pedidos registrados', value: orders.length, note: formatCurrency(inventoryValue) + ' em estoque', icon: ShoppingBag, tone: 'red', page: 'pedidos' }
  ];

  return (
    <>
      <section className="metrics-grid">
        {metrics.map(({ label, value, note, icon: Icon, tone, page }, index) => <button key={label} className={`metric-card metric-${tone}`} onClick={() => onNavigate(page)} style={{ '--delay': `${index * 70}ms` }}><span className="metric-top"><span>{label}</span><Icon size={18} /></span><strong className="metric-value">{loading ? '—' : value}</strong><span className="metric-note">{note}</span></button>)}
      </section>
      <div className="dashboard-grid">
        <section className="panel stock-panel">
          <div className="panel-heading"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Estoque em atenção</h2></div><button className="text-button" onClick={() => onNavigate('estoque')}>Ver estoque <ArrowRight size={15} /></button></div>
          {loading && inventory.length === 0 ? <div className="empty-panel">Carregando inventário...</div> : inventoryWithProduct.length === 0 ? <div className="empty-panel">Nenhum item de estoque disponível.</div> : <div className="stock-list">{inventoryWithProduct.map((item, index) => {
            const product = productById[item.id_produto] || {};
            const minimum = Number(item.estoque_minimo || 0);
            const quantity = Number(item.quantidade || 0);
            const isLow = item.estoque_minimo != null && quantity <= minimum;
            const width = Math.min(100, Math.max(minimum ? quantity / minimum * 55 : quantity * 2, 8));
            return <div className="stock-row" key={item.id_estoque ?? item.id_produto} style={{ '--delay': `${index * 60}ms` }}><span className="product-thumb">{product.imagem_produto ? <img src={product.imagem_produto} alt="" /> : <Package size={18} />}</span><span className="stock-product"><strong>{product.nome || `Produto #${item.id_produto}`}</strong><small>{item.localizacao || 'Localização não informada'}</small></span><span className="stock-level"><span><i className={isLow ? 'level-low' : ''} style={{ width: `${width}%` }} /></span><small>{quantity} un.</small></span><span className={`stock-flag ${isLow ? 'flag-low' : 'flag-ok'}`}>{isLow ? 'Repor' : 'Normal'}</span></div>;
          })}</div>}
          <button className="panel-link" onClick={() => onNavigate('estoque')}><Settings2 size={15} /> Gerenciar níveis de estoque</button>
        </section>
        <section className="panel movement-panel">
          <div className="panel-heading"><div><p className="eyebrow">ÚLTIMOS REGISTROS</p><h2>Entradas recentes</h2></div><button className="icon-button" onClick={onRefresh} title="Atualizar entradas"><Activity size={17} /></button></div>
          {loading && latestEntries.length === 0 ? <div className="empty-panel">Carregando movimentações...</div> : latestEntries.length === 0 ? <div className="empty-panel">Nenhuma entrada registrada ainda.</div> : <div className="movement-list">{latestEntries.map((entry) => {
            const product = productById[entry.id_produto] || {};
            return <div className="movement-row" key={entry.id_entrada}><span className="movement-symbol"><ArrowDownToLine size={16} /></span><span className="movement-copy"><strong>{product.nome || `Produto #${entry.id_produto}`}</strong><small>{entry.quantidade} unidades · {formatDate(entry.data_entrada)}</small></span><span className="movement-value">{formatCurrency(Number(entry.valor_unitario) * Number(entry.quantidade))}</span></div>;
          })}</div>}
          <button className="panel-link" onClick={() => onNavigate('entradas')}><ArrowDownToLine size={15} /> Registrar entrada de produtos</button>
        </section>
      </div>
      <section className="operations-strip"><div className="strip-icon"><Activity size={19} /></div><div><p className="eyebrow">RESUMO DA OPERAÇÃO</p><strong>{lowStock.length ? `${lowStock.length} ${lowStock.length === 1 ? 'produto precisa' : 'produtos precisam'} de reposição.` : 'O estoque está dentro dos níveis mínimos definidos.'}</strong><small>Atualizado ao consultar os registros da API.</small></div><button className="button button-outline" onClick={() => onNavigate('estoque')}>Revisar estoque <ArrowRight size={15} /></button></section>
    </>
  );
}

function RecordDialog({ dialog, onClose, onSave }) {
  const resource = resources[dialog.resource];
  const [values, setValues] = useState(() => {
    const initial = {};
    resource.fields.forEach((field) => {
      const value = dialog.record?.[field.name];
      initial[field.name] = field.type === 'checkbox' ? (value == null ? Boolean(field.defaultValue) : Number(value) === 1) : value == null ? '' : String(value).slice(0, field.type === 'date' ? 10 : field.type === 'datetime-local' ? 16 : undefined).replace(' ', 'T');
    });
    return initial;
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const payload = {};
    resource.fields.forEach((field) => {
      const value = values[field.name];
      if (field.type === 'checkbox') payload[field.name] = value ? 1 : 0;
      else if (value !== '' && !(field.name === 'senha' && dialog.mode === 'edit')) payload[field.name] = field.type === 'number' ? Number(value) : value;
    });
    try { await onSave(payload); } catch (saveError) { setError(saveError.message); } finally { setBusy(false); }
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="record-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header className="dialog-heading"><div><p className="eyebrow">CADASTRO <span>·</span> {resource.title.toUpperCase()}</p><h2 id="dialog-title">{dialog.mode === 'edit' ? `Editar ${resource.singular}` : `Novo ${resource.singular}`}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar formulário"><X size={19} /></button></header>
    <form onSubmit={submit}><div className="dialog-fields">{resource.fields.map((field) => <label key={field.name} className={`${field.type === 'checkbox' ? 'checkbox-field' : ''} ${field.name === 'descricao' || field.name === 'imagem_produto' || field.name === 'observacao' ? 'wide-field' : ''}`}>
      {field.type === 'checkbox' ? <><input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValues({ ...values, [field.name]: event.target.checked })} /><span className="check-control"><Check size={13} /></span>{field.label}</> : <>{field.label}{field.name === 'imagem_produto' ? <input type="url" placeholder="https://..." value={values[field.name]} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} required={field.required} /> : <input type={field.type || 'text'} step={field.step} value={values[field.name]} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} required={field.required && !(dialog.mode === 'edit' && field.name === 'senha')} placeholder={dialog.mode === 'edit' && field.name === 'senha' ? 'Deixe em branco para manter a senha atual' : ''} />}</>}
    </label>)}</div>{error && <p className="form-error dialog-error" role="alert">{error}</p>}<footer className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar registro'}<ArrowRight size={16} /></button></footer></form></section></div>;
}

function exportCsv(resource, rows) {
  const headings = [resource.id, ...resource.columns];
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const content = [headings.map(quote).join(';'), ...rows.map((row) => headings.map((field) => quote(row[field])).join(';'))].join('\r\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resource.table}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default App;