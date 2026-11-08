/**
 * TransactionModel: Gerencia o ciclo de vida das transações financeiras.
 */
import { apiService } from './ApiService.js';
import { eventBus } from '../utils/eventBus.js';

class TransactionModel {
  constructor() {
    this.transactions = [];
  }

  async fetchTransactions(month, year) {
    try {
      const query = month && year ? `?month=${month}&year=${year}` : '';
      const data = await apiService.request(`/api/transactions${query}`, { method: 'GET' });
      this.transactions = Array.isArray(data) ? data : [];
      // Ordena por data decrescente
      this.transactions.sort((a, b) => new Date(b.transactionDate || 0) - new Date(a.transactionDate || 0));
      eventBus.emit('transactions:updated', this.transactions);
      return this.transactions;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  }

  getCachedTransactions() {
    return this.transactions;
  }

  async createTransaction({ description, amount, transactionDate, categoryId }) {
    try {
      const newTx = await apiService.request('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          transactionDate,
          categoryId: categoryId ? parseInt(categoryId, 10) : null
        })
      });
      eventBus.emit('transaction:created', newTx);
      return newTx;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  async updateTransaction(id, { description, amount, transactionDate, categoryId }) {
    try {
      const updated = await apiService.request(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          transactionDate,
          categoryId: categoryId ? parseInt(categoryId, 10) : null
        })
      });
      eventBus.emit('transaction:updated', updated);
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }

  async deleteTransaction(id) {
    try {
      await apiService.request(`/api/transactions/${id}`, { method: 'DELETE' });
      this.transactions = this.transactions.filter(t => t.id !== id);
      eventBus.emit('transaction:deleted', id);
      return true;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  }
}

export const transactionModel = new TransactionModel();
