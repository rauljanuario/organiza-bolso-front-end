/**
 * RulesView: Tela de Regras de Categorização para associação automática de palavras-chave.
 * Fiel à janela "Regras de Categorização" do design.
 */
import { eventBus } from '../utils/eventBus.js';

export class RulesView {
  constructor(containerId = 'content-container') {
    this.container = document.getElementById(containerId);
    this.rules = [];
  }

  setData({ rules }) {
    this.rules = rules || [];
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="content-area">
        <div style="display:flex; align-items:center; justify-content:flex-end; margin-bottom: 20px;">
          <button class="btn-primary" id="btn-new-rule">+ Nova Regra</button>
        </div>

        <!-- Banner Informativo -->
        <div class="alert-info-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div style="flex: 1;">
            <span>Motor de busca automática cadastradas: </span>
            <span class="alert-badge">Status Ativo</span>
          </div>
        </div>

        <!-- Tabela de Regras -->
        <div class="card-panel">
          <div class="table-responsive">
            ${this.renderRulesTable()}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderRulesTable() {
    if (!this.rules || this.rules.length === 0) {
      return `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <h4 class="empty-title">Nenhuma regra de categorização cadastrada</h4>
          <p class="empty-description">Cadastre palavras-chave como 'UBER', 'IFOOD' ou 'POSTO' para categorizar extratos bancários automaticamente ao importar.</p>
          <button class="btn-primary" id="btn-empty-new-rule">+ Criar Primeira Regra</button>
        </div>
      `;
    }

    const rows = this.rules.map(rule => `
      <tr>
        <td style="font-weight: 600; color: #1e293b;">${rule.keyword}</td>
        <td>
          <span class="badge badge-categoria">${rule.categoryName || 'Categoria #' + rule.categoryId}</span>
        </td>
        <td style="color: #64748b; font-weight: 500;">${rule.priority || 1}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon btn-edit-rule" data-id="${rule.id}" title="Editar regra">
              <!-- Lápis -->
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button class="btn-icon delete btn-delete-rule" data-id="${rule.id}" title="Excluir regra">
              <!-- Lixeira -->
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Palavra-chave</th>
            <th>Categoria</th>
            <th>Prioridade</th>
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

    const btnNew = this.container.querySelector('#btn-new-rule');
    if (btnNew) {
      btnNew.addEventListener('click', () => eventBus.emit('rule:modal-open'));
    }

    const btnEmptyNew = this.container.querySelector('#btn-empty-new-rule');
    if (btnEmptyNew) {
      btnEmptyNew.addEventListener('click', () => eventBus.emit('rule:modal-open'));
    }

    const editBtns = this.container.querySelectorAll('.btn-edit-rule');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('rule:edit-open', id);
      });
    });

    const deleteBtns = this.container.querySelectorAll('.btn-delete-rule');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('rule:delete-request', id);
      });
    });
  }
}
