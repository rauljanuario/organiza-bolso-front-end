/**
 * RuleModel: Gerencia regras de associação automática de palavras-chave a categorias.
 */
import { apiService } from './ApiService.js';
import { eventBus } from '../utils/eventBus.js';

class RuleModel {
  constructor() {
    this.rules = [];
  }

  async fetchRules() {
    try {
      const data = await apiService.request('/api/category-rules', { method: 'GET' });
      this.rules = Array.isArray(data) ? data : [];
      // Ordenar por prioridade crescente (1 tem maior relevância)
      this.rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      eventBus.emit('rules:updated', this.rules);
      return this.rules;
    } catch (error) {
      console.error('Erro ao buscar regras:', error);
      throw error;
    }
  }

  getCachedRules() {
    return this.rules;
  }

  async createRule({ keyword, categoryId, priority }) {
    try {
      const newRule = await apiService.request('/api/category-rules', {
        method: 'POST',
        body: JSON.stringify({
          keyword: (keyword || '').trim().toUpperCase(),
          categoryId: parseInt(categoryId, 10),
          priority: parseInt(priority, 10) || 1
        })
      });
      await this.fetchRules();
      eventBus.emit('rule:created', newRule);
      return newRule;
    } catch (error) {
      console.error('Erro ao cadastrar regra:', error);
      throw error;
    }
  }

  async updateRule(id, { keyword, categoryId, priority }) {
    try {
      const updated = await apiService.request(`/api/category-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          keyword: (keyword || '').trim().toUpperCase(),
          categoryId: parseInt(categoryId, 10),
          priority: parseInt(priority, 10) || 1
        })
      });
      await this.fetchRules();
      eventBus.emit('rule:updated', updated);
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar regra:', error);
      throw error;
    }
  }

  async deleteRule(id) {
    try {
      await apiService.request(`/api/category-rules/${id}`, { method: 'DELETE' });
      await this.fetchRules();
      eventBus.emit('rule:deleted', id);
      return true;
    } catch (error) {
      console.error('Erro ao remover regra:', error);
      throw error;
    }
  }
}

export const ruleModel = new RuleModel();
