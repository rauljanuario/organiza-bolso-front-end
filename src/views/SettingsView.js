/**
 * SettingsView: Configurações do sistema voltadas ao usuário final comum.
 * Interface amigável com perfil, preferências de exibição, exportação de dados e segurança.
 */
import { userModel } from '../models/UserModel.js';
import { transactionModel } from '../models/TransactionModel.js';
import { eventBus } from '../utils/eventBus.js';
import { toastView } from './ToastView.js';

export class SettingsView {
  constructor(containerId = 'content-container') {
    this.container = document.getElementById(containerId);
    this.preferences = this.loadPreferences();
  }

  loadPreferences() {
    const saved = localStorage.getItem('ob_user_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      startDayOfMonth: '1',
      alertNegativeBalance: true,
      autoCategorizeImports: true
    };
  }

  savePreferences(prefs) {
    this.preferences = { ...this.preferences, ...prefs };
    localStorage.setItem('ob_user_preferences', JSON.stringify(this.preferences));
    toastView.success('Preferências salvas com sucesso!');
  }

  render() {
    if (!this.container) return;
    const user = userModel.getUser() || { name: 'Visitante', email: '' };
    const isAuthenticated = userModel.isAuthenticated;

    this.container.innerHTML = `
      <div class="content-area">
        <!-- Card 1: Meu Perfil -->
        <div class="card-panel" style="margin-bottom: 24px;">
          <div class="panel-header">
            <h3 class="panel-title">Meu Perfil</h3>
            <span class="badge ${isAuthenticated ? 'badge-sucesso' : 'badge-categoria'}">
              <span class="badge-status-dot" style="background-color: ${isAuthenticated ? '#16a34a' : '#94a3b8'};"></span>
              ${isAuthenticated ? 'Conta Ativa' : 'Modo Convidado'}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap; padding-bottom: 20px; border-bottom: 1px solid var(--border-light);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0284c7); color: white; display:flex; align-items:center; justify-content:center; font-size: 24px; font-weight: 700; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25);">
              ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div style="display:flex; flex-direction:column; gap:4px;">
              <span style="font-size: 18px; font-weight: 700; color: var(--text-main);">
                ${user.name || 'Visitante'}
              </span>
              <span style="font-size: 13px; color: var(--text-muted);">
                ${user.email || 'Nenhum e-mail vinculado à sessão atual'}
              </span>
            </div>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top: 18px;">
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">
              ${isAuthenticated ? 'Você está conectado à sua conta segura.' : 'Crie uma conta gratuita ou entre para sincronizar suas finanças.'}
            </p>
            <div style="display:flex; gap:10px;">
              <button class="btn-primary" id="btn-settings-auth">
                ${isAuthenticated ? 'Trocar de Conta' : 'Entrar / Criar Conta'}
              </button>
              ${isAuthenticated ? '<button class="btn-secondary" id="btn-settings-logout" style="color:#ef4444;">Sair da Conta</button>' : ''}
            </div>
          </div>
        </div>

        <!-- Card 2: Preferências do Sistema -->
        <div class="card-panel" style="margin-bottom: 24px;">
          <div class="panel-header">
            <h3 class="panel-title">Preferências do Sistema</h3>
          </div>

          <form id="preferences-form" style="display:flex; flex-direction:column; gap:20px; max-width: 680px;">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:18px;">
              <div class="form-group">
                <label class="form-label" for="pref-currency">Moeda Padrão</label>
                <select class="form-select" id="pref-currency">
                  <option value="BRL" ${this.preferences.currency === 'BRL' ? 'selected' : ''}>Real Brasileiro (R$)</option>
                  <option value="USD" ${this.preferences.currency === 'USD' ? 'selected' : ''}>Dólar Americano ($)</option>
                  <option value="EUR" ${this.preferences.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="pref-date-format">Formato de Data</label>
                <select class="form-select" id="pref-date-format">
                  <option value="DD/MM/YYYY" ${this.preferences.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/AAAA (Padrão Brasil)</option>
                  <option value="YYYY-MM-DD" ${this.preferences.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>AAAA-MM-DD (Internacional)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="pref-start-day">Dia de Início do Mês Financeiro</label>
                <select class="form-select" id="pref-start-day">
                  <option value="1" ${this.preferences.startDayOfMonth === '1' ? 'selected' : ''}>Dia 1 (Início do mês corrente)</option>
                  <option value="5" ${this.preferences.startDayOfMonth === '5' ? 'selected' : ''}>Dia 5 (Dia útil comum)</option>
                  <option value="10" ${this.preferences.startDayOfMonth === '10' ? 'selected' : ''}>Dia 10 (Fechamento de cartão)</option>
                  <option value="15" ${this.preferences.startDayOfMonth === '15' ? 'selected' : ''}>Dia 15 (Meio do mês)</option>
                  <option value="25" ${this.preferences.startDayOfMonth === '25' ? 'selected' : ''}>Dia 25 (Fechamento)</option>
                </select>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px; padding:14px; background:var(--bg-card-subtle); border-radius:var(--radius-md); border:1px solid var(--border-light);">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:500;">
                <input type="checkbox" id="pref-alert-negative" ${this.preferences.alertNegativeBalance ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                <span>Destacar alerta visual quando o saldo mensal estiver negativo</span>
              </label>

              <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:500;">
                <input type="checkbox" id="pref-auto-cat" ${this.preferences.autoCategorizeImports ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                <span>Aplicar regras de categorização automaticamente ao importar extratos</span>
              </label>
            </div>

            <div>
              <button type="submit" class="btn-primary">Salvar Preferências</button>
            </div>
          </form>
        </div>

        <!-- Card 3: Meus Dados & Exportação -->
        <div class="card-panel" style="margin-bottom: 24px;">
          <div class="panel-header">
            <h3 class="panel-title">Gerenciamento de Dados</h3>
          </div>

          <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
            Exporte suas informações para uma planilha ou faça uma limpeza do seu histórico financeiro.
          </p>

          <div style="display:flex; flex-wrap:wrap; gap:12px;">
            <button class="btn-secondary" id="btn-export-csv" style="display:inline-flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Exportar Minhas Transações (.csv)</span>
            </button>

            <button class="btn-secondary" id="btn-reset-data" style="color:#ef4444; border-color:#fecaca;">
              Redefinir Dados Financeiros
            </button>
          </div>
        </div>

        <!-- Card 4: Ajuda & Sobre -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title">Sobre o Organiza Bolso</h3>
          </div>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.6; margin-bottom:12px;">
            O <strong>Organiza Bolso</strong> é o seu assistente de gestão financeira pessoal.
            Adicione transações manualmente ou importe extratos bancários nos formatos <strong>.CSV</strong> ou <strong>.OFX</strong> para organizar seus gastos e receitas de forma automática e segura.
          </p>
          <div style="font-size:12px; color:var(--text-light);">
            Versão 1.0 &bull; Organiza Bolso
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Salvar Preferências
    const form = this.container.querySelector('#preferences-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const currency = this.container.querySelector('#pref-currency').value;
        const dateFormat = this.container.querySelector('#pref-date-format').value;
        const startDayOfMonth = this.container.querySelector('#pref-start-day').value;
        const alertNegativeBalance = this.container.querySelector('#pref-alert-negative').checked;
        const autoCategorizeImports = this.container.querySelector('#pref-auto-cat').checked;

        this.savePreferences({
          currency,
          dateFormat,
          startDayOfMonth,
          alertNegativeBalance,
          autoCategorizeImports
        });
      });
    }

    // Botão de login / conta
    const authBtn = this.container.querySelector('#btn-settings-auth');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        eventBus.emit('auth:open-modal');
      });
    }

    // Botão de logout
    const logoutBtn = this.container.querySelector('#btn-settings-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        userModel.logout();
        this.render();
        toastView.info('Você saiu da sua conta.');
      });
    }

    // Exportar Transações para CSV
    const exportBtn = this.container.querySelector('#btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const transactions = transactionModel.getCachedTransactions();
        if (!transactions || transactions.length === 0) {
          toastView.info('Nenhuma transação cadastrada para exportar.');
          return;
        }

        // Montar conteúdo CSV
        const headers = ['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor'];
        const csvRows = [headers.join(';')];

        transactions.forEach(t => {
          csvRows.push([
            t.transactionDate || '',
            `"${(t.description || '').replace(/"/g, '""')}"`,
            `"${(t.categoryName || 'Geral').replace(/"/g, '""')}"`,
            t.type === 'INCOME' ? 'Receita' : 'Despesa',
            (t.amount || 0).toFixed(2).replace('.', ',')
          ].join(';'));
        });

        const csvString = '\uFEFF' + csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `organiza_bolso_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toastView.success('Download do extrato concluído!');
      });
    }

    // Redefinir dados com confirmação amigável
    const resetBtn = this.container.querySelector('#btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Tem certeza de que deseja redefinir seus dados? Suas transações e regras locais serão excluídas.')) {
          ['ob_db_categories', 'ob_db_transactions', 'ob_db_rules', 'ob_db_imports'].forEach(k => {
            localStorage.removeItem(k);
          });
          toastView.success('Dados redefinidos com sucesso.');
          location.reload();
        }
      });
    }
  }
}
