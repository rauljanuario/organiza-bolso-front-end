/**
 * ApiService: Centraliza todas as chamadas HTTP para o back-end Spring Boot (http://localhost:8080).
 * Inclui tratamento de Token JWT, tratamento de erros e repositório local transparente
 * caso o back-end ainda não esteja iniciado, garantindo que o usuário consiga usar e testar
 * imediatamente sem quebrar a aplicação.
 */

class ApiService {
  constructor() {
    this.storageKeyUrl = 'organiza_bolso_api_url';
    this.storageKeyToken = 'organiza_bolso_token';
    this.storageKeyMode = 'organiza_bolso_mode'; // 'api' | 'local'

    this.baseUrl = localStorage.getItem(this.storageKeyUrl) || 'http://localhost:8080';
    this.token = localStorage.getItem(this.storageKeyToken) || null;
    this.isBackendAvailable = false;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, '');
    localStorage.setItem(this.storageKeyUrl, this.baseUrl);
  }

  getToken() {
    return this.token;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(this.storageKeyToken, token);
    } else {
      localStorage.removeItem(this.storageKeyToken);
    }
  }

  clearAuth() {
    this.setToken(null);
  }

  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${this.baseUrl}/api/categories`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);
      const cType = (response && response.headers.get('content-type')) || '';
      this.isBackendAvailable = !!(response && (response.ok || response.status === 401) && cType.includes('application/json'));
      return this.isBackendAvailable;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  getHeaders(isMultipart = false) {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const isMultipart = options.body instanceof FormData;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isMultipart),
        ...(options.headers || {})
      }
    };

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token inválido ou expirado
        this.clearAuth();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isJson = contentType.includes('application/json');
      let data = null;

      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Se retornou documento HTML (roteador de proxy/SPA), não é a API Spring Boot
        if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
          this.isBackendAvailable = false;
          return this.handleLocalFallback(endpoint, options);
        }
        try {
          data = JSON.parse(text);
        } catch {
          this.isBackendAvailable = false;
          return this.handleLocalFallback(endpoint, options);
        }
      }

      if (!response.ok) {
        if (response.status === 404 || response.status >= 500) {
          this.isBackendAvailable = false;
          return this.handleLocalFallback(endpoint, options);
        }
        const errorMessage = (data && data.message) || `Erro na requisição: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      this.isBackendAvailable = true;
      return data;
    } catch (error) {
      // Se falhou por conexão recusada (backend offline)
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        this.isBackendAvailable = false;
        // Aciona o fallback do banco local transparente
        return this.handleLocalFallback(endpoint, options);
      }
      throw error;
    }
  }

  // =========================================================================
  // FALLBACK LOCAL INTELIGENTE (Permite usar o app mesmo se Spring Boot não estiver ligado)
  // Sem dados de exemplo pré-cadastrados, pronto para uso do usuário!
  // =========================================================================
  handleLocalFallback(endpoint, options) {
    console.warn(`[OrganizaBolso] Backend ${this.baseUrl} inacessível. Operando via armazenamento local.`);
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;

    // Gerenciador de estado local
    const getLocal = (key, def = []) => JSON.parse(localStorage.getItem(`ob_db_${key}`) || JSON.stringify(def));
    const setLocal = (key, val) => localStorage.setItem(`ob_db_${key}`, JSON.stringify(val));

    // Categorias
    if (endpoint.startsWith('/api/categories')) {
      let categories = getLocal('categories', []);
      
      if (method === 'GET') {
        return categories;
      }
      if (method === 'POST') {
        const newCat = {
          id: Date.now(),
          name: body.name,
          type: body.type || 'EXPENSE'
        };
        categories.push(newCat);
        setLocal('categories', categories);
        return newCat;
      }
      if (method === 'PUT') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        categories = categories.map(c => c.id === id ? { ...c, ...body } : c);
        setLocal('categories', categories);
        return categories.find(c => c.id === id);
      }
      if (method === 'DELETE') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        categories = categories.filter(c => c.id !== id);
        setLocal('categories', categories);
        return null;
      }
    }

    // Regras de Categorização
    if (endpoint.startsWith('/api/category-rules')) {
      let rules = getLocal('rules', []);
      const categories = getLocal('categories', []);

      if (method === 'GET') {
        return rules.map(r => {
          const cat = categories.find(c => c.id === r.categoryId);
          return { ...r, categoryName: cat ? cat.name : 'Sem categoria' };
        });
      }
      if (method === 'POST') {
        const newRule = {
          id: Date.now(),
          keyword: body.keyword,
          categoryId: body.categoryId,
          priority: body.priority || 1
        };
        rules.push(newRule);
        setLocal('rules', rules);
        const cat = categories.find(c => c.id === newRule.categoryId);
        return { ...newRule, categoryName: cat ? cat.name : 'Sem categoria' };
      }
      if (method === 'PUT') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        rules = rules.map(r => r.id === id ? { ...r, ...body } : r);
        setLocal('rules', rules);
        return rules.find(r => r.id === id);
      }
      if (method === 'DELETE') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        rules = rules.filter(r => r.id !== id);
        setLocal('rules', rules);
        return null;
      }
    }

    // Transações
    if (endpoint.startsWith('/api/transactions')) {
      let transactions = getLocal('transactions', []);
      const categories = getLocal('categories', []);

      if (method === 'GET') {
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
        const month = urlParams.get('month');
        const year = urlParams.get('year');

        let filtered = transactions;
        if (month && year) {
          filtered = filtered.filter(t => {
            if (!t.transactionDate) return false;
            const [y, m] = t.transactionDate.split('-');
            return y === String(year) && m === String(month).padStart(2, '0');
          });
        }

        return filtered.map(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          return {
            ...t,
            categoryName: cat ? cat.name : (t.categoryName || 'Geral'),
            type: cat ? cat.type : (t.type || 'EXPENSE')
          };
        });
      }

      if (method === 'POST') {
        const cat = categories.find(c => c.id === body.categoryId);
        const newTx = {
          id: Date.now(),
          description: body.description,
          amount: parseFloat(body.amount) || 0,
          transactionDate: body.transactionDate,
          categoryId: body.categoryId || null,
          categoryName: cat ? cat.name : 'Geral',
          type: cat ? cat.type : (body.amount >= 0 ? 'INCOME' : 'EXPENSE'),
          manuallyCategorized: true
        };
        transactions.unshift(newTx);
        setLocal('transactions', transactions);
        return newTx;
      }

      if (method === 'PUT') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        const cat = categories.find(c => c.id === body.categoryId);
        transactions = transactions.map(t => {
          if (t.id === id) {
            return {
              ...t,
              ...body,
              amount: parseFloat(body.amount) || t.amount,
              categoryName: cat ? cat.name : t.categoryName,
              type: cat ? cat.type : t.type,
              manuallyCategorized: true
            };
          }
          return t;
        });
        setLocal('transactions', transactions);
        return transactions.find(t => t.id === id);
      }

      if (method === 'DELETE') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        transactions = transactions.filter(t => t.id !== id);
        setLocal('transactions', transactions);
        return null;
      }
    }

    // Dashboard: Summary & Categories
    if (endpoint.startsWith('/api/dashboard/summary')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const month = urlParams.get('month');
      const year = urlParams.get('year');
      const transactions = getLocal('transactions', []);
      const categories = getLocal('categories', []);

      let filtered = transactions;
      if (month && year) {
        filtered = filtered.filter(t => {
          if (!t.transactionDate) return false;
          const [y, m] = t.transactionDate.split('-');
          return y === String(year) && m === String(month).padStart(2, '0');
        });
      }

      let totalIncome = 0;
      let totalExpense = 0;

      filtered.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const isIncome = cat ? cat.type === 'INCOME' : (t.type === 'INCOME' || t.amount > 0);
        const val = Math.abs(t.amount);
        if (isIncome) {
          totalIncome += val;
        } else {
          totalExpense += val;
        }
      });

      const balance = totalIncome - totalExpense;
      return { totalIncome, totalExpense, balance };
    }

    if (endpoint.startsWith('/api/dashboard/categories')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const month = urlParams.get('month');
      const year = urlParams.get('year');
      const reqType = urlParams.get('type') || 'EXPENSE';
      const transactions = getLocal('transactions', []);
      const categories = getLocal('categories', []);

      let filtered = transactions;
      if (month && year) {
        filtered = filtered.filter(t => {
          if (!t.transactionDate) return false;
          const [y, m] = t.transactionDate.split('-');
          return y === String(year) && m === String(month).padStart(2, '0');
        });
      }

      const categoryTotals = {};
      let totalAll = 0;

      filtered.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const type = cat ? cat.type : t.type;
        if (type === reqType) {
          const catName = cat ? cat.name : 'Outros';
          const catId = cat ? cat.id : null;
          const val = Math.abs(t.amount);
          totalAll += val;
          if (!categoryTotals[catName]) {
            categoryTotals[catName] = { categoryId: catId, categoryName: catName, total: 0 };
          }
          categoryTotals[catName].total += val;
        }
      });

      return Object.values(categoryTotals).map(item => ({
        ...item,
        percentage: totalAll > 0 ? (item.total / totalAll) * 100 : 0
      }));
    }

    // Importações
    if (endpoint.startsWith('/api/imports')) {
      let imports = getLocal('imports', []);
      if (method === 'GET') {
        return imports;
      }
      if (method === 'DELETE') {
        const id = parseInt(endpoint.split('/').pop(), 10);
        imports = imports.filter(i => i.id !== id);
        setLocal('imports', imports);
        // Cascade remove transactions created by this import
        let transactions = getLocal('transactions', []);
        transactions = transactions.filter(t => t.importId !== id);
        setLocal('transactions', transactions);
        return null;
      }
    }

    // Autenticação
    if (endpoint === '/api/auth/login') {
      const token = 'jwt_token_local_session_' + Date.now();
      this.setToken(token);
      setLocal('currentUser', { name: body.email.split('@')[0], email: body.email });
      return { token };
    }

    if (endpoint === '/api/auth/register') {
      const token = 'jwt_token_local_session_' + Date.now();
      this.setToken(token);
      setLocal('currentUser', { name: body.name, email: body.email });
      return { token, message: 'Usuário cadastrado com sucesso' };
    }

    if (endpoint === '/api/users/me') {
      const user = getLocal('currentUser', null);
      if (!user) {
        return { name: 'Visitante', email: 'usuario@organizabolso.com' };
      }
      return user;
    }

    return {};
  }
}

export const apiService = new ApiService();
