/**
 * TransactionsController: Gerencia a listagem, criação, edição e remoção de transações.
 */
import { transactionModel } from '../models/TransactionModel.js';
import { categoryModel } from '../models/CategoryModel.js';
import { TransactionsView } from '../views/TransactionsView.js';
import { modalView } from '../views/ModalView.js';
import { toastView } from '../views/ToastView.js';
import { eventBus } from '../utils/eventBus.js';

export class TransactionsController {
  constructor() {
    this.view = new TransactionsView('content-container');
    this.currentMonth = null;
    this.currentYear = null;
    this.bindEvents();
  }

  bindEvents() {
    // Abertura de modal de nova transação
    eventBus.on('transaction:modal-open', async () => {
      const categories = await categoryModel.fetchCategories().catch(() => []);
      if (categories.length === 0) {
        toastView.info('Recomendamos criar ao menos uma categoria antes de adicionar transações.');
      }
      modalView.openTransactionModal({ transaction: null, categories });
    });

    // Abertura de modal para edição
    eventBus.on('transaction:edit-open', async (id) => {
      const transactions = transactionModel.getCachedTransactions();
      const tx = transactions.find(t => t.id === id);
      const categories = await categoryModel.fetchCategories().catch(() => []);
      if (tx) {
        modalView.openTransactionModal({ transaction: tx, categories });
      }
    });

    // Salvar criação
    eventBus.on('transaction:save-create', async (data) => {
      try {
        await transactionModel.createTransaction(data);
        toastView.success('Transação adicionada com sucesso!');
        await this.load(this.currentMonth, this.currentYear);
        eventBus.emit('data:reload');
      } catch (error) {
        toastView.error('Erro ao salvar transação: ' + error.message);
      }
    });

    // Salvar edição
    eventBus.on('transaction:save-edit', async ({ id, ...data }) => {
      try {
        await transactionModel.updateTransaction(id, data);
        toastView.success('Transação atualizada!');
        await this.load(this.currentMonth, this.currentYear);
        eventBus.emit('data:reload');
      } catch (error) {
        toastView.error('Erro ao atualizar transação: ' + error.message);
      }
    });

    // Pedido de exclusão
    eventBus.on('transaction:delete-request', (id) => {
      modalView.openConfirmModal({
        title: 'Excluir Transação',
        message: 'Tem certeza de que deseja remover esta transação?',
        onConfirm: async () => {
          try {
            await transactionModel.deleteTransaction(id);
            toastView.success('Transação removida!');
            await this.load(this.currentMonth, this.currentYear);
            eventBus.emit('data:reload');
          } catch (error) {
            toastView.error('Erro ao excluir: ' + error.message);
          }
        }
      });
    });
  }

  async load(month, year) {
    this.currentMonth = month;
    this.currentYear = year;
    try {
      const [transactions, categories] = await Promise.all([
        transactionModel.fetchTransactions(month, year).catch(() => []),
        categoryModel.fetchCategories().catch(() => [])
      ]);

      this.view.setData({ transactions, categories });
    } catch (error) {
      console.error('Erro ao carregar TransactionsController:', error);
    }
  }
}
