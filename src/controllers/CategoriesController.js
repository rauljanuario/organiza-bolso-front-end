/**
 * CategoriesController: Coordena ações de categorias de receitas e despesas.
 */
import { categoryModel } from '../models/CategoryModel.js';
import { CategoriesView } from '../views/CategoriesView.js';
import { modalView } from '../views/ModalView.js';
import { toastView } from '../views/ToastView.js';
import { eventBus } from '../utils/eventBus.js';

export class CategoriesController {
  constructor() {
    this.view = new CategoriesView('content-container');
    this.bindEvents();
  }

  bindEvents() {
    // Abrir modal de nova categoria
    eventBus.on('category:modal-open', () => {
      modalView.openCategoryModal({ category: null });
    });

    // Abrir modal para editar
    eventBus.on('category:edit-open', (id) => {
      const cat = categoryModel.getCategoryById(id);
      if (cat) {
        modalView.openCategoryModal({ category: cat });
      }
    });

    // Salvar nova categoria
    eventBus.on('category:save-create', async (data) => {
      try {
        await categoryModel.createCategory(data);
        toastView.success('Categoria criada com sucesso!');
        await this.load();
        eventBus.emit('data:reload');
      } catch (error) {
        toastView.error('Erro ao criar categoria: ' + error.message);
      }
    });

    // Salvar edição
    eventBus.on('category:save-edit', async ({ id, ...data }) => {
      try {
        await categoryModel.updateCategory(id, data);
        toastView.success('Categoria atualizada!');
        await this.load();
        eventBus.emit('data:reload');
      } catch (error) {
        toastView.error('Erro ao atualizar categoria: ' + error.message);
      }
    });

    // Excluir categoria
    eventBus.on('category:delete-request', (id) => {
      modalView.openConfirmModal({
        title: 'Excluir Categoria',
        message: 'Tem certeza de que deseja remover esta categoria? Transações vinculadas terão a categoria definida como nula.',
        onConfirm: async () => {
          try {
            await categoryModel.deleteCategory(id);
            toastView.success('Categoria excluída!');
            await this.load();
            eventBus.emit('data:reload');
          } catch (error) {
            toastView.error('Erro ao excluir: ' + error.message);
          }
        }
      });
    });
  }

  async load() {
    try {
      const categories = await categoryModel.fetchCategories().catch(() => []);
      this.view.setData({ categories });
    } catch (error) {
      console.error('Erro ao carregar CategoriesController:', error);
    }
  }
}
