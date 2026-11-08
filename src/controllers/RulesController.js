/**
 * RulesController: Coordena as regras de associação automática de palavras-chave.
 */
import { ruleModel } from '../models/RuleModel.js';
import { categoryModel } from '../models/CategoryModel.js';
import { RulesView } from '../views/RulesView.js';
import { modalView } from '../views/ModalView.js';
import { toastView } from '../views/ToastView.js';
import { eventBus } from '../utils/eventBus.js';

export class RulesController {
  constructor() {
    this.view = new RulesView('content-container');
    this.bindEvents();
  }

  bindEvents() {
    // Abrir modal de nova regra
    eventBus.on('rule:modal-open', async () => {
      const categories = await categoryModel.fetchCategories().catch(() => []);
      if (categories.length === 0) {
        toastView.info('Crie categorias antes de definir regras de categorização.');
      }
      modalView.openRuleModal({ rule: null, categories });
    });

    // Abrir modal de edição de regra
    eventBus.on('rule:edit-open', async (id) => {
      const rules = ruleModel.getCachedRules();
      const rule = rules.find(r => r.id === id);
      const categories = await categoryModel.fetchCategories().catch(() => []);
      if (rule) {
        modalView.openRuleModal({ rule, categories });
      }
    });

    // Salvar nova regra
    eventBus.on('rule:save-create', async (data) => {
      try {
        await ruleModel.createRule(data);
        toastView.success('Regra criada com sucesso!');
        await this.load();
      } catch (error) {
        toastView.error('Erro ao cadastrar regra: ' + error.message);
      }
    });

    // Salvar edição
    eventBus.on('rule:save-edit', async ({ id, ...data }) => {
      try {
        await ruleModel.updateRule(id, data);
        toastView.success('Regra atualizada!');
        await this.load();
      } catch (error) {
        toastView.error('Erro ao atualizar regra: ' + error.message);
      }
    });

    // Excluir regra
    eventBus.on('rule:delete-request', (id) => {
      modalView.openConfirmModal({
        title: 'Excluir Regra',
        message: 'Tem certeza de que deseja remover esta regra de categorização?',
        onConfirm: async () => {
          try {
            await ruleModel.deleteRule(id);
            toastView.success('Regra removida!');
            await this.load();
          } catch (error) {
            toastView.error('Erro ao excluir: ' + error.message);
          }
        }
      });
    });
  }

  async load() {
    try {
      const [rules] = await Promise.all([
        ruleModel.fetchRules().catch(() => []),
        categoryModel.fetchCategories().catch(() => [])
      ]);
      this.view.setData({ rules });
    } catch (error) {
      console.error('Erro ao carregar RulesController:', error);
    }
  }
}
