/**
 * ImportView: Tela para importação de extratos (.csv e .ofx) e histórico de arquivos.
 * Fiel à janela "Importar Extrato" do design.
 */
import { formatDate } from '../utils/formatters.js';
import { eventBus } from '../utils/eventBus.js';

export class ImportView {
  constructor(containerId = 'content-container') {
    this.container = document.getElementById(containerId);
    this.imports = [];
    this.isUploading = false;
  }

  setData({ imports }) {
    this.imports = imports || [];
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="content-area">
        <!-- Área de Upload (Drag and Drop) -->
        <div class="dropzone-container" id="csv-dropzone">
          <input type="file" id="file-input" accept=".csv, .ofx" style="display: none;" />
          
          <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M12 18v-6"/>
            <path d="m9 15 3-3 3 3"/>
          </svg>

          <p class="dropzone-text">Arraste e solte o seu arquivo .csv aqui</p>
          <p class="dropzone-subtext">Compatível com arquivos bancários nos formatos CSV e OFX</p>
          
          <button class="btn-primary" id="btn-browse-file" type="button">
            Buscar arquivo
          </button>
          
          <div id="upload-status" style="margin-top: 16px; font-weight: 500; font-size: 13px;"></div>
        </div>

        <!-- Seção: Histórico de Importações -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title">Histórico de Importações</h3>
          </div>

          <div class="table-responsive">
            ${this.renderImportsTable()}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderImportsTable() {
    if (!this.imports || this.imports.length === 0) {
      return `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          <h4 class="empty-title">Nenhum extrato importado</h4>
          <p class="empty-description">Envie um arquivo .csv ou .ofx do seu banco para processar e categorizar automaticamente suas transações.</p>
        </div>
      `;
    }

    const rows = this.imports.map(item => `
      <tr>
        <td>${formatDate(item.importDate)}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px; font-weight:500;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>${item.fileName}</span>
          </div>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <span class="badge badge-sucesso" style="width: fit-content;">
              <span class="badge-status-dot"></span> Sucesso
            </span>
            <span style="font-size:11px; color:#64748b;">${item.transactionCount || 0} transações categorizadas</span>
          </div>
        </td>
        <td>
          <button class="btn-icon delete btn-delete-import" data-id="${item.id}" title="Desfazer importação">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Nome do arquivo</th>
            <th>Status</th>
            <th style="width: 80px;">Ações</th>
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

    const dropzone = this.container.querySelector('#csv-dropzone');
    const fileInput = this.container.querySelector('#file-input');
    const browseBtn = this.container.querySelector('#btn-browse-file');
    const statusEl = this.container.querySelector('#upload-status');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // Ações de exclusão de importação
    const deleteButtons = this.container.querySelectorAll('.btn-delete-import');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        eventBus.emit('import:delete-request', id);
      });
    });
  }

  handleFileUpload(file) {
    const validExtensions = ['.csv', '.ofx'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      eventBus.emit('toast:error', 'Formato inválido. Por favor envie um arquivo .csv ou .ofx');
      return;
    }

    const statusEl = this.container.querySelector('#upload-status');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#1d6ee6;">Processando "${file.name}"...</span>`;
    }

    eventBus.emit('import:file-selected', file);
  }
}
