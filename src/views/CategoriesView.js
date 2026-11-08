/**
 * CategoriesView: Tela de gerenciamento de Categorias de Receitas e Despesas.
 */
import { eventBus } from '../utils/eventBus.js';

export class CategoriesView {
  constructor(containerId = 'content-container') {
    this.container = document.getElementById(containerId);
    this.categories = [];
    this.filterType = 'ALL';
  }

  setData({ categories }) {
    this.categories = categories || [];
    this.render();
  }

  getFilteredCategories() {
    if (this.filterType === 'ALL') return this.categories;
    return this.categories.filter(c => c.type === this.filterType);
  }

  render() {
    if (!this.container) return;
    const filtered = this.getFilteredCategories();

    this.container.innerHTML = `
      <div class="content-area">
        <div style="display:flex; align-items:center; justify-content:flex-end; margin-bottom: 20px;">
          <button class="btn-primary" id="btn-new-category">+ Nova Categoria</button>
        </div>

        <!-- Abas de filtro -->
        <div style="margin-bottom: 20px;">
          <div class="btn-pill-group" style="width: fit-content;">
            <button class="btn-pill ${this.filterType === 'ALL' ? 'active' : ''}" data-type="ALL">Todas</button>
            <button class="btn-pill ${this.filterType === 'EXPENSE' ? 'active' : ''}" data-type="EXPENSE">Despesas</button>
            <button class="btn-pill ${this.filterType === 'INCOME' ? 'active' : ''}" data-type="INCOME">Receitas</button>
          </div>
        </div>

        <!-- Tabela / Grade de Categorias -->
        <div class="card-panel">
          <div class="table-responsive">
            ${this.renderCategoriesTable(filtered)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderCategoriesTable(categories) {
    if (!categories || categories.length === 0) {
      return `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h4 class="empty-title">Nenhuma categoria encontrada</h4>
          <p class="empty-description">Cadastre categorias personalizadas para organizar suas finanças e alimentar as regras de importação.</p>
          <button class="btn-primary" id="btn-empty-new-cat">+ Cadastrar Primeira Categoria</button>
        </div>
      `;
    }

    const rows = categories.map(cat => {
      const isIncome = cat.type === 'INCOME';
      return `
        <tr>
          <td style="font-weight: 600;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${isIncome ? '#10b981' : '#f45d48'};"></div>
              <span>${cat.name}</span>
            </div>
          </td>
          <td>
            <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
              ${isIncome ? 'Receita' : 'Despesa'}
            </span>
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn-icon btn-edit-category" data-id="${cat.id}" title="Editar categoria">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button class="btn-icon delete btn-delete-category" data-id="${cat.id}" title="Excluir categoria">
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
            <th>Nome da Categoria</th>
            <th>Tipo</th>
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

    const btnNew = this.container.querySelector('#btn-new-category');
    if (btnNew) {
      btnNew.addEventListener('click', () => eventBus.emit('category:modal-open'));
    }

    const btnEmptyNew = this.container.querySelector('#btn-empty-new-cat');
    if (btnEmptyNew) {
      btnEmptyNew.addEventListener('click', () => eventBus.emit('category:modal-open'));
    }

    const pills = this.container.querySelectorAll('.btn-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterType = pill.getAttribute('data-type');
        this.render();
      });
    });

    const editBtns = this.container.querySelectorAll('.btn-edit-category');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('category:edit-open', id);
      });
    });

    const deleteBtns = this.container.querySelectorAll('.btn-delete-category');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('category:delete-request', id);
      });
    });
  }
}
