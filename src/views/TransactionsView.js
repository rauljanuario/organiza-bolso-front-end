/**
 * TransactionsView: Visualização completa de transações com filtros, paginação e resumo.
 */
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { eventBus } from '../utils/eventBus.js';

export class TransactionsView {
  constructor(containerId = 'content-container') {
    this.container = document.getElementById(containerId);
    this.transactions = [];
    this.categories = [];
    this.filterType = 'ALL';
    this.filterCategory = 'ALL';
    this.searchQuery = '';
  }

  setData({ transactions, categories }) {
    this.transactions = transactions || [];
    this.categories = categories || [];
    this.render();
  }

  getFilteredTransactions() {
    return this.transactions.filter(t => {
      if (this.filterType !== 'ALL' && t.type !== this.filterType) {
        return false;
      }
      if (this.filterCategory !== 'ALL' && String(t.categoryId) !== String(this.filterCategory)) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const catMatch = (t.categoryName || '').toLowerCase().includes(q);
        return descMatch || catMatch;
      }
      return true;
    });
  }

  render() {
    if (!this.container) return;
    const filtered = this.getFilteredTransactions();

    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach(t => {
      const val = Math.abs(t.amount || 0);
      if (t.type === 'INCOME') totalIncome += val;
      else totalExpense += val;
    });
    const balance = totalIncome - totalExpense;

    this.container.innerHTML = `
      <div class="content-area">
        <div style="display:flex; align-items:center; justify-content:flex-end; margin-bottom: 20px;">
          <button class="btn-primary" id="btn-new-transaction">+ Nova Transação</button>
        </div>

        <!-- Barra de Filtros e Busca -->
        <div class="card-panel" style="padding: 16px; margin-bottom: 20px;">
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;">
              <div class="btn-pill-group">
                <button class="btn-pill ${this.filterType === 'ALL' ? 'active' : ''}" data-type="ALL">Todas</button>
                <button class="btn-pill ${this.filterType === 'INCOME' ? 'active' : ''}" data-type="INCOME">Receitas</button>
                <button class="btn-pill ${this.filterType === 'EXPENSE' ? 'active' : ''}" data-type="EXPENSE">Despesas</button>
              </div>

              <select class="select-custom" id="filter-category-select">
                <option value="ALL">Todas as Categorias</option>
                ${this.categories.map(c => `
                  <option value="${c.id}" ${String(this.filterCategory) === String(c.id) ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div style="position:relative; width: 240px;">
              <input type="text" class="form-input" id="search-tx-input" placeholder="Buscar transação..." value="${this.searchQuery}" style="padding-left: 32px; font-size:13px;" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="position:absolute; left:10px; top:11px;">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          </div>

          <!-- Mini resumo do filtro -->
          <div style="display:flex; gap:20px; margin-top:14px; padding-top:12px; border-top:1px solid #f1f5f9; font-size:13px;">
            <span>Total filtrado: <strong>${filtered.length} transações</strong></span>
            <span style="color:#059669;">Receitas: <strong>${formatCurrency(totalIncome)}</strong></span>
            <span style="color:#e11d48;">Despesas: <strong>${formatCurrency(totalExpense)}</strong></span>
            <span style="color:#1d6ee6;">Saldo: <strong>${formatCurrency(balance)}</strong></span>
          </div>
        </div>

        <!-- Tabela de Transações -->
        <div class="card-panel">
          <div class="table-responsive">
            ${this.renderTransactionsTable(filtered)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderTransactionsTable(transactions) {
    if (!transactions || transactions.length === 0) {
      return `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
          <h4 class="empty-title">Nenhuma transação encontrada</h4>
          <p class="empty-description">Não foram encontradas movimentações com os filtros atuais neste período.</p>
          <button class="btn-primary" id="btn-empty-new-tx">+ Adicionar Transação</button>
        </div>
      `;
    }

    const rows = transactions.map(t => {
      const isIncome = t.type === 'INCOME';
      const badgeClass = isIncome ? 'badge-income' : (t.categoryName && t.categoryName.toLowerCase().includes('aliment') ? 'badge-alimentacao' : 'badge-categoria');

      return `
        <tr>
          <td>${formatDate(t.transactionDate)}</td>
          <td style="font-weight: 600;">
            ${t.description}
            ${t.manuallyCategorized ? '<span style="font-size:10px; color:#94a3b8; font-weight:normal; margin-left:4px;">(manual)</span>' : ''}
          </td>
          <td>
            <span class="badge ${badgeClass}">${t.categoryName || 'Geral'}</span>
          </td>
          <td>
            <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
              ${isIncome ? 'Receita' : 'Despesa'}
            </span>
          </td>
          <td style="font-weight: 700; color: ${isIncome ? '#059669' : '#1e293b'};">
            ${isIncome ? '+' : '-'} ${formatCurrency(t.amount)}
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn-icon btn-edit-tx" data-id="${t.id}" title="Editar transação">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button class="btn-icon delete btn-delete-tx" data-id="${t.id}" title="Excluir transação">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th style="width: 100px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  bindEvents() {
    if (!this.container) return;

    // Novo
    const btnNew = this.container.querySelector('#btn-new-transaction');
    if (btnNew) {
      btnNew.addEventListener('click', () => eventBus.emit('transaction:modal-open'));
    }

    const btnEmptyNew = this.container.querySelector('#btn-empty-new-tx');
    if (btnEmptyNew) {
      btnEmptyNew.addEventListener('click', () => eventBus.emit('transaction:modal-open'));
    }

    // Filtros de Tipo
    const pills = this.container.querySelectorAll('.btn-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterType = pill.getAttribute('data-type');
        this.render();
      });
    });

    // Filtro de Categoria
    const catSelect = this.container.querySelector('#filter-category-select');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.filterCategory = e.target.value;
        this.render();
      });
    }

    // Busca
    const searchInput = this.container.querySelector('#search-tx-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const filtered = this.getFilteredTransactions();
        const tableContainer = this.container.querySelector('.table-responsive');
        if (tableContainer) {
          tableContainer.innerHTML = this.renderTransactionsTable(filtered);
          this.bindRowActions();
        }
      });
    }

    this.bindRowActions();
  }

  bindRowActions() {
    const editBtns = this.container.querySelectorAll('.btn-edit-tx');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('transaction:edit-open', id);
      });
    });

    const deleteBtns = this.container.querySelectorAll('.btn-delete-tx');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('transaction:delete-request', id);
      });
    });
  }
}
