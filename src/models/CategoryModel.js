/**
 * CategoryModel: Gerencia o CRUD de categorias de receitas e despesas.
 */
import { apiService } from './ApiService.js';
import { eventBus } from '../utils/eventBus.js';

class CategoryModel {
  constructor() {
    this.categories = [];
  }

  async fetchCategories() {
    try {
      const data = await apiService.request('/api/categories', { method: 'GET' });
      this.categories = Array.isArray(data) ? data : [];
      eventBus.emit('categories:updated', this.categories);
      return this.categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  getCachedCategories() {
    return this.categories;
  }

  getCategoryById(id) {
    return this.categories.find(c => c.id === parseInt(id, 10));
  }

  async createCategory({ name, type }) {
    try {
      const newCategory = await apiService.request('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type: type || 'EXPENSE' })
      });
      await this.fetchCategories();
      eventBus.emit('category:created', newCategory);
      return newCategory;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  async updateCategory(id, { name, type }) {
    try {
      const updated = await apiService.request(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, type })
      });
      await this.fetchCategories();
      eventBus.emit('category:updated', updated);
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      await apiService.request(`/api/categories/${id}`, { method: 'DELETE' });
      await this.fetchCategories();
      eventBus.emit('category:deleted', id);
      return true;
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  }
}

export const categoryModel = new CategoryModel();
