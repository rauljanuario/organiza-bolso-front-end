/**
 * SidebarView: Barra lateral de navegação com tema escuro e ícones fiéis ao design.
 */
import { eventBus } from '../utils/eventBus.js';

export class SidebarView {
  constructor(containerId = 'sidebar-container') {
    this.container = document.getElementById(containerId);
    this.currentRoute = 'painel';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  setActiveRoute(route) {
    this.currentRoute = route;
    if (!this.container) return;
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      if (itemRoute === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <aside class="sidebar" id="app-sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">
            <!-- Ícone de Carteira -->
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <div class="sidebar-logo-text">
            <span class="sidebar-logo-title">Organiza</span>
            <span class="sidebar-logo-sub">Bolso</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-item ${this.currentRoute === 'painel' ? 'active' : ''}" data-route="painel">
            <span class="nav-icon">
              <!-- Ícone de Painel / Grid -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </span>
            <span>Painel</span>
          </button>

          <button class="nav-item ${this.currentRoute === 'transacoes' ? 'active' : ''}" data-route="transacoes">
            <span class="nav-icon">
              <!-- Ícone de Transações / Transferência -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </span>
            <span>Transações</span>
          </button>

          <button class="nav-item ${this.currentRoute === 'categorias' ? 'active' : ''}" data-route="categorias">
            <span class="nav-icon">
              <!-- Ícone de Categorias / Pasta -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span>Categorias</span>
          </button>

          <button class="nav-item ${this.currentRoute === 'regras' ? 'active' : ''}" data-route="regras">
            <span class="nav-icon">
              <!-- Ícone de Regras / Tag -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </span>
            <span>Regras</span>
          </button>

          <button class="nav-item ${this.currentRoute === 'importar' ? 'active' : ''}" data-route="importar">
            <span class="nav-icon">
              <!-- Ícone de Importar / Download -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </span>
            <span>Importar CSV</span>
          </button>

          <button class="nav-item ${this.currentRoute === 'configuracoes' ? 'active' : ''}" data-route="configuracoes">
            <span class="nav-icon">
              <!-- Ícone de Configurações / Engrenagem -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            <span>Configurações</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <span>Organiza Bolso &bull; v1.0</span>
        </div>
      </aside>
    `;
  }

  bindEvents() {
    if (!this.container) return;
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('.nav-item');
      if (button) {
        const route = button.getAttribute('data-route');
        this.setActiveRoute(route);
        eventBus.emit('navigate', route);
        
        // Fechar menu mobile se aberto
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
}
