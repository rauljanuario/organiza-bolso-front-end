/**
 * AppController: Orquestrador principal da aplicação Organiza Bolso (MVC).
 * Gerencia ciclo de vida, roteamento entre telas, estado global e sincronização.
 */
import { SidebarView } from '../views/SidebarView.js';
import { HeaderView } from '../views/HeaderView.js';
import { SettingsView } from '../views/SettingsView.js';
import { authModalView } from '../views/AuthModalView.js';
import { toastView } from '../views/ToastView.js';

import { DashboardController } from './DashboardController.js';
import { TransactionsController } from './TransactionsController.js';
import { CategoriesController } from './CategoriesController.js';
import { RulesController } from './RulesController.js';
import { ImportController } from './ImportController.js';

import { userModel } from '../models/UserModel.js';
import { apiService } from '../models/ApiService.js';
import { eventBus } from '../utils/eventBus.js';

export class AppController {
  constructor() {
    this.sidebarView = new SidebarView('sidebar-container');
    this.headerView = new HeaderView('header-container');
    this.settingsView = new SettingsView('content-container');

    this.dashboardController = new DashboardController();
    this.transactionsController = new TransactionsController();
    this.categoriesController = new CategoriesController();
    this.rulesController = new RulesController();
    this.importController = new ImportController();

    this.activeRoute = 'painel';
    this.bindEvents();
  }

  async init() {
    // Verificar autenticação e dados do perfil
    await userModel.loadUserProfile().catch(() => null);

    // Verificar conexão com o back-end Spring Boot
    const isOnline = await apiService.checkBackendHealth();
    if (!isOnline) {
      console.info('[OrganizaBolso] Back-end local (localhost:8080) não detectado. Iniciando em modo de dados local transparente.');
    }

    // Navegar para rota inicial (ou rota da hash)
    const hash = window.location.hash.replace('#', '') || 'painel';
    this.navigate(hash);
  }

  bindEvents() {
    // Navegação disparada por Sidebar ou links internos
    eventBus.on('navigate', (route) => {
      this.navigate(route);
    });

    // Mudança de mês / ano no cabeçalho
    eventBus.on('period:changed', () => {
      this.loadCurrentRoute();
    });

    // Recarregar dados após mutações (criação, edição, importação)
    eventBus.on('data:reload', () => {
      this.loadCurrentRoute();
    });

    // Abertura do modal de autenticação
    eventBus.on('auth:open-modal', () => {
      authModalView.open('login');
    });

    // Toasts disparados por qualquer componente
    eventBus.on('toast:success', (msg) => toastView.success(msg));
    eventBus.on('toast:error', (msg) => toastView.error(msg));
    eventBus.on('toast:info', (msg) => toastView.info(msg));

    // Suporte ao botão voltar/avançar do navegador
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'painel';
      if (hash !== this.activeRoute) {
        this.navigate(hash, false);
      }
    });
  }

  navigate(route, updateHash = true) {
    const validRoutes = ['painel', 'transacoes', 'categorias', 'regras', 'importar', 'configuracoes'];
    if (!validRoutes.includes(route)) {
      route = 'painel';
    }

    this.activeRoute = route;
    if (updateHash) {
      window.location.hash = route;
    }

    this.sidebarView.setActiveRoute(route);

    // Atualiza o título na barra superior
    const titles = {
      painel: 'Painel Geral',
      transacoes: 'Transações',
      categorias: 'Categorias',
      regras: 'Regras de Categorização',
      importar: 'Importar Extrato',
      configuracoes: 'Configurações'
    };
    this.headerView.setTitle(titles[route] || 'Organiza Bolso');

    this.loadCurrentRoute();
  }

  loadCurrentRoute() {
    const { month, year } = this.headerView.getPeriod();

    switch (this.activeRoute) {
      case 'painel':
        this.dashboardController.load(month, year);
        break;
      case 'transacoes':
        this.transactionsController.load(month, year);
        break;
      case 'categorias':
        this.categoriesController.load();
        break;
      case 'regras':
        this.rulesController.load();
        break;
      case 'importar':
        this.importController.load();
        break;
      case 'configuracoes':
        this.settingsView.render();
        break;
    }
  }
}
