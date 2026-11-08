/**
 * ModalView: Gerenciador de janelas modais para criação e edição de transações,
 * categorias e regras de categorização.
 */
import { eventBus } from '../utils/eventBus.js';

export class ModalView {
  constructor() {
    this.overlay = document.getElementById('app-modal-overlay');
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'app-modal-overlay';
      this.overlay.className = 'modal-overlay';
      document.body.appendChild(this.overlay);
    }
  }

  close() {
    this.overlay.classList.remove('open');
    this.overlay.innerHTML = '';
  }

  // =========================================================================
  // MODAL DE TRANSAÇÃO (NOVA / EDITAR)
  // =========================================================================
  openTransactionModal({ transaction = null, categories = [] } = {}) {
    const isEdit = !!transaction;
    const today = new Date().toISOString().split('T')[0];
    const initialDate = transaction ? (transaction.transactionDate ? transaction.transactionDate.split('T')[0] : today) : today;

    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <form id="tx-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="tx-desc">Descrição</label>
              <input type="text" class="form-input" id="tx-desc" required placeholder="Ex: Supermercado, Salário, Internet" value="${transaction ? transaction.description : ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="tx-amount">Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" class="form-input" id="tx-amount" required placeholder="0.00" value="${transaction ? Math.abs(transaction.amount) : ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="tx-date">Data da Transação</label>
              <input type="date" class="form-input" id="tx-date" required value="${initialDate}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="tx-category">Categoria</label>
              <select class="form-select" id="tx-category" required>
                <option value="">Selecione uma categoria...</option>
                ${categories.map(c => `
                  <option value="${c.id}" ${transaction && transaction.categoryId === c.id ? 'selected' : ''}>
                    ${c.name} (${c.type === 'INCOME' ? 'Receita' : 'Despesa'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancelar</button>
            <button type="submit" class="btn-primary">${isEdit ? 'Salvar Alterações' : 'Cadastrar'}</button>
          </div>
        </form>
      </div>
    `;

    this.overlay.classList.add('open');

    const form = this.overlay.querySelector('#tx-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        description: this.overlay.querySelector('#tx-desc').value.trim(),
        amount: parseFloat(this.overlay.querySelector('#tx-amount').value),
        transactionDate: this.overlay.querySelector('#tx-date').value,
        categoryId: parseInt(this.overlay.querySelector('#tx-category').value, 10)
      };

      if (isEdit) {
        eventBus.emit('transaction:save-edit', { id: transaction.id, ...payload });
      } else {
        eventBus.emit('transaction:save-create', payload);
      }
      this.close();
    });

    this.bindCommonCloseEvents();
  }

  // =========================================================================
  // MODAL DE CATEGORIA (NOVA / EDITAR)
  // =========================================================================
  openCategoryModal({ category = null } = {}) {
    const isEdit = !!category;

    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <form id="cat-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="cat-name">Nome da Categoria</label>
              <input type="text" class="form-input" id="cat-name" required placeholder="Ex: Alimentação, Transporte, Salário" value="${category ? category.name : ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="cat-type">Tipo</label>
              <select class="form-select" id="cat-type" required>
                <option value="EXPENSE" ${category && category.type === 'EXPENSE' ? 'selected' : ''}>Despesa</option>
                <option value="INCOME" ${category && category.type === 'INCOME' ? 'selected' : ''}>Receita</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancelar</button>
            <button type="submit" class="btn-primary">${isEdit ? 'Salvar Alterações' : 'Criar Categoria'}</button>
          </div>
        </form>
      </div>
    `;

    this.overlay.classList.add('open');

    const form = this.overlay.querySelector('#cat-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        name: this.overlay.querySelector('#cat-name').value.trim(),
        type: this.overlay.querySelector('#cat-type').value
      };

      if (isEdit) {
        eventBus.emit('category:save-edit', { id: category.id, ...payload });
      } else {
        eventBus.emit('category:save-create', payload);
      }
      this.close();
    });

    this.bindCommonCloseEvents();
  }

  // =========================================================================
  // MODAL DE REGRA DE CATEGORIZAÇÃO (NOVA / EDITAR)
  // =========================================================================
  openRuleModal({ rule = null, categories = [] } = {}) {
    const isEdit = !!rule;

    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Editar Regra de Categorização' : 'Nova Regra de Categorização'}</h3>
          <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <form id="rule-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="rule-keyword">Palavra-chave</label>
              <input type="text" class="form-input" id="rule-keyword" required placeholder="Ex: UBER, IFOOD, POSTO, NETFLIX" value="${rule ? rule.keyword : ''}" />
              <span style="font-size:11px; color:#64748b;">A busca identifica esta palavra na descrição das transações do extrato importado.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-category">Categoria Associada</label>
              <select class="form-select" id="rule-category" required>
                <option value="">Selecione uma categoria...</option>
                ${categories.map(c => `
                  <option value="${c.id}" ${rule && rule.categoryId === c.id ? 'selected' : ''}>
                    ${c.name} (${c.type === 'INCOME' ? 'Receita' : 'Despesa'})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-priority">Prioridade</label>
              <input type="number" min="1" max="100" class="form-input" id="rule-priority" required value="${rule ? rule.priority : 1}" />
              <span style="font-size:11px; color:#64748b;">Valores menores indicam maior prioridade (ex: 1 é avaliado antes de 2).</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancelar</button>
            <button type="submit" class="btn-primary">${isEdit ? 'Salvar Regra' : 'Criar Regra'}</button>
          </div>
        </form>
      </div>
    `;

    this.overlay.classList.add('open');

    const form = this.overlay.querySelector('#rule-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        keyword: this.overlay.querySelector('#rule-keyword').value.trim(),
        categoryId: parseInt(this.overlay.querySelector('#rule-category').value, 10),
        priority: parseInt(this.overlay.querySelector('#rule-priority').value, 10) || 1
      };

      if (isEdit) {
        eventBus.emit('rule:save-edit', { id: rule.id, ...payload });
      } else {
        eventBus.emit('rule:save-create', payload);
      }
      this.close();
    });

    this.bindCommonCloseEvents();
  }

  // =========================================================================
  // MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
  // =========================================================================
  openConfirmModal({ title, message, onConfirm }) {
    this.overlay.innerHTML = `
      <div class="modal-container" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">${title || 'Confirmar Exclusão'}</h3>
          <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size:13px; color:#475569;">${message || 'Tem certeza que deseja realizar esta operação?'}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancelar</button>
          <button type="button" class="btn-danger" id="modal-confirm-btn">Excluir</button>
        </div>
      </div>
    `;

    this.overlay.classList.add('open');

    const confirmBtn = this.overlay.querySelector('#modal-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (typeof onConfirm === 'function') onConfirm();
        this.close();
      });
    }

    this.bindCommonCloseEvents();
  }

  bindCommonCloseEvents() {
    const closeBtn = this.overlay.querySelector('#modal-close-btn');
    const cancelBtn = this.overlay.querySelector('#modal-cancel-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }
}

export const modalView = new ModalView();
