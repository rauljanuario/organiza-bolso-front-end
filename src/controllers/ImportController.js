/**
 * ImportController: Coordena a importação de extratos bancários (.csv e .ofx).
 */
import { importModel } from '../models/ImportModel.js';
import { ImportView } from '../views/ImportView.js';
import { modalView } from '../views/ModalView.js';
import { toastView } from '../views/ToastView.js';
import { eventBus } from '../utils/eventBus.js';

export class ImportController {
  constructor() {
    this.view = new ImportView('content-container');
    this.bindEvents();
  }

  bindEvents() {
    // Arquivo selecionado ou solto
    eventBus.on('import:file-selected', async (file) => {
      try {
        const result = await importModel.uploadFile(file);
        const count = result.transactionCount || 0;
        toastView.success(`Extrato "${file.name}" importado com sucesso! ${count} transações categorizadas.`);
        await this.load();
        eventBus.emit('data:reload');
      } catch (error) {
        toastView.error('Falha ao importar extrato: ' + error.message);
      }
    });

    // Desfazer / Excluir importação
    eventBus.on('import:delete-request', (id) => {
      modalView.openConfirmModal({
        title: 'Desfazer Importação',
        message: 'Tem certeza de que deseja desfazer esta importação? Todas as transações vinculadas a este arquivo serão removidas.',
        onConfirm: async () => {
          try {
            await importModel.deleteImport(id);
            toastView.success('Importação desfeita e transações associadas removidas.');
            await this.load();
            eventBus.emit('data:reload');
          } catch (error) {
            toastView.error('Erro ao excluir importação: ' + error.message);
          }
        }
      });
    });
  }

  async load() {
    try {
      const imports = await importModel.fetchImports().catch(() => []);
      this.view.setData({ imports });
    } catch (error) {
      console.error('Erro ao carregar ImportController:', error);
    }
  }
}
