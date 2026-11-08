/**
 * DashboardModel: Métricas agregadas e consolidação para gráficos e cards de resumo.
 */
import { apiService } from './ApiService.js';
import { eventBus } from '../utils/eventBus.js';

class DashboardModel {
  constructor() {
    this.summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0
    };
    this.categoryMetrics = [];
  }

  async fetchSummary(month, year) {
    try {
      const query = month && year ? `?month=${month}&year=${year}` : '';
      const data = await apiService.request(`/api/dashboard/summary${query}`, { method: 'GET' });
      this.summary = {
        totalIncome: (data && data.totalIncome) || 0,
        totalExpense: (data && data.totalExpense) || 0,
        balance: (data && data.balance) || 0
      };
      eventBus.emit('dashboard:summary_updated', this.summary);
      return this.summary;
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      throw error;
    }
  }

  async fetchCategoryMetrics(month, year, type = 'EXPENSE') {
    try {
      const query = month && year ? `?month=${month}&year=${year}&type=${type}` : `?type=${type}`;
      const data = await apiService.request(`/api/dashboard/categories${query}`, { method: 'GET' });
      this.categoryMetrics = Array.isArray(data) ? data : [];
      eventBus.emit('dashboard:categories_updated', this.categoryMetrics);
      return this.categoryMetrics;
    } catch (error) {
      console.error('Erro ao buscar métricas por categoria:', error);
      throw error;
    }
  }

  getSummary() {
    return this.summary;
  }

  getCategoryMetrics() {
    return this.categoryMetrics;
  }
}

export const dashboardModel = new DashboardModel();
