/**
 * DashboardController: Coordena os dados e interações do Painel Geral.
 */
import { dashboardModel } from '../models/DashboardModel.js';
import { transactionModel } from '../models/TransactionModel.js';
import { categoryModel } from '../models/CategoryModel.js';
import { DashboardView } from '../views/DashboardView.js';
import { eventBus } from '../utils/eventBus.js';

export class DashboardController {
  constructor() {
    this.view = new DashboardView('content-container');
  }

  async load(month, year) {
    try {
      // Carregar em paralelo para máxima velocidade
      const [summary, transactions, categoryMetrics] = await Promise.all([
        dashboardModel.fetchSummary(month, year).catch(() => ({ totalIncome: 0, totalExpense: 0, balance: 0 })),
        transactionModel.fetchTransactions(month, year).catch(() => []),
        dashboardModel.fetchCategoryMetrics(month, year, 'EXPENSE').catch(() => [])
      ]);

      // Também garantir categorias em cache para formatadores
      categoryModel.fetchCategories().catch(() => []);

      this.view.setData({
        summary,
        transactions,
        categoryMetrics
      });
    } catch (error) {
      console.error('Erro ao carregar DashboardController:', error);
    }
  }
}
