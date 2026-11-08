/**
 * HeaderView: Barra superior com título dinâmico, seletor de mês/ano e perfil de usuário.
 */
import { getMonthName, padZero } from '../utils/formatters.js';
import { eventBus } from '../utils/eventBus.js';
import { userModel } from '../models/UserModel.js';
import { apiService } from '../models/ApiService.js';

export class HeaderView {
  constructor(containerId = 'header-container') {
    this.container = document.getElementById(containerId);
    
    // Período padrão: Mês atual ou Agosto 2026 como nos exemplos da API
    const now = new Date();
    this.currentMonth = padZero(now.getMonth() + 1);
    this.currentYear = String(now.getFullYear());
    this.pageTitle = 'Painel Geral';
    this.isDropdownOpen = false;

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();

    eventBus.on('user:loaded', () => this.updateUserDisplay());
    eventBus.on('auth:changed', () => this.updateUserDisplay());
  }

  setTitle(title) {
    this.pageTitle = title;
    const titleEl = this.container.querySelector('.page-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  getPeriod() {
    return { month: this.currentMonth, year: this.currentYear };
  }

  setPeriod(month, year) {
    this.currentMonth = padZero(month);
    this.currentYear = String(year);
    this.updatePeriodDisplay();
  }

  updatePeriodDisplay() {
    const labelEl = this.container.querySelector('.period-label');
    if (labelEl) {
      labelEl.textContent = `${getMonthName(this.currentMonth)} / ${this.currentYear}`;
    }
  }

  updateUserDisplay() {
    const user = userModel.getUser();
    const nameEl = this.container.querySelector('.user-name');
    const avatarEl = this.container.querySelector('.user-avatar');
    const dropdownHeader = this.container.querySelector('.user-dropdown-header');
    
    if (user && user.name) {
      if (nameEl) nameEl.textContent = user.name;
      if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
      if (dropdownHeader) {
        dropdownHeader.innerHTML = `
          <div class="user-full-name">${user.name}</div>
          <div class="user-email">${user.email || 'Usuário autenticado'}</div>
        `;
      }
    } else {
      if (nameEl) nameEl.textContent = 'Minha Conta';
      if (avatarEl) avatarEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      if (dropdownHeader) {
        dropdownHeader.innerHTML = `
          <div class="user-full-name">Não autenticado</div>
          <div class="user-email">Clique abaixo para entrar</div>
        `;
      }
    }
  }

  render() {
    if (!this.container) return;
    const user = userModel.getUser() || { name: 'Nome usuário' };

    this.container.innerHTML = `
      <header class="top-navbar">
        <div class="top-navbar-left">
          <button class="mobile-menu-toggle" id="mobile-toggle" aria-label="Abrir menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 class="page-title">${this.pageTitle}</h1>
        </div>

        <div class="top-navbar-right">
          <!-- Seletor de Período Mês/Ano -->
          <div class="period-selector">
            <button class="period-btn" id="period-prev" title="Mês anterior">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="period-label" id="period-display">${getMonthName(this.currentMonth)} / ${this.currentYear}</span>
            <button class="period-btn" id="period-next" title="Próximo mês">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <!-- Dropdown do Usuário -->
          <div class="user-dropdown-container">
            <button class="user-profile-btn" id="user-profile-trigger">
              <div class="user-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
              <span class="user-name">${user.name || 'Nome usuário'}</span>
              <span class="user-caret">&#9662;</span>
            </button>

            <div class="user-dropdown-menu" id="user-dropdown-menu">
              <div class="user-dropdown-header">
                <div class="user-full-name">${user.name || 'Visitante'}</div>
                <div class="user-email">${user.email || 'Sessão ativa'}</div>
              </div>
              <button class="user-dropdown-item" id="btn-open-auth">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>Entrar / Cadastrar</span>
              </button>
              <button class="user-dropdown-item" id="btn-nav-settings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Configurações</span>
              </button>
              <button class="user-dropdown-item danger" id="btn-logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  bindEvents() {
    if (!this.container) return;

    // Toggle menu mobile
    const mobileBtn = this.container.querySelector('#mobile-toggle');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      });
    }

    // Navegação de período
    const prevBtn = this.container.querySelector('#period-prev');
    const nextBtn = this.container.querySelector('#period-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.changeMonth(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.changeMonth(1));
    }

    // Toggle dropdown do usuário
    const profileTrigger = this.container.querySelector('#user-profile-trigger');
    const menu = this.container.querySelector('#user-dropdown-menu');
    
    if (profileTrigger && menu) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isDropdownOpen = !this.isDropdownOpen;
        menu.classList.toggle('show', this.isDropdownOpen);
      });

      document.addEventListener('click', () => {
        if (this.isDropdownOpen) {
          this.isDropdownOpen = false;
          menu.classList.remove('show');
        }
      });
    }

    // Ações do menu
    const btnOpenAuth = this.container.querySelector('#btn-open-auth');
    if (btnOpenAuth) {
      btnOpenAuth.addEventListener('click', () => eventBus.emit('auth:open-modal'));
    }

    const btnNavSettings = this.container.querySelector('#btn-nav-settings');
    if (btnNavSettings) {
      btnNavSettings.addEventListener('click', () => eventBus.emit('navigate', 'configuracoes'));
    }

    const btnLogout = this.container.querySelector('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        userModel.logout();
        eventBus.emit('toast:info', 'Você saiu da conta.');
      });
    }
  }

  changeMonth(delta) {
    let m = parseInt(this.currentMonth, 10) + delta;
    let y = parseInt(this.currentYear, 10);
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    this.currentMonth = padZero(m);
    this.currentYear = String(y);
    this.updatePeriodDisplay();
    eventBus.emit('period:changed', { month: this.currentMonth, year: this.currentYear });
  }
}
