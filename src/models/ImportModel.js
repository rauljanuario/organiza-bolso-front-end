/**
 * ImportModel: Gerencia upload de extratos (.csv e .ofx) e histórico de importações.
 */
import { apiService } from './ApiService.js';
import { ruleModel } from './RuleModel.js';
import { categoryModel } from './CategoryModel.js';
import { eventBus } from '../utils/eventBus.js';

class ImportModel {
  constructor() {
    this.imports = [];
  }

  async fetchImports() {
    try {
      const data = await apiService.request('/api/imports', { method: 'GET' });
      this.imports = Array.isArray(data) ? data : [];
      this.imports.sort((a, b) => new Date(b.importDate || 0) - new Date(a.importDate || 0));
      eventBus.emit('imports:updated', this.imports);
      return this.imports;
    } catch (error) {
      console.error('Erro ao buscar importações:', error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      // Se backend online, envia FormData multipart/form-data conforme especificação do README
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await apiService.request('/api/imports', {
          method: 'POST',
          body: formData
        });
        await this.fetchImports();
        eventBus.emit('import:completed', response);
        return response;
      } catch (networkOrApiErr) {
        // Se backend estiver inacessível, processa o arquivo localmente com as regras cadastradas
        return await this.processFileLocally(file);
      }
    } catch (error) {
      console.error('Erro ao processar importação:', error);
      throw error;
    }
  }

  async processFileLocally(file) {
    const text = await file.text();
    const fileName = file.name;
    const rules = ruleModel.getCachedRules();
    const categories = categoryModel.getCachedCategories();
    const newTransactions = [];

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    // Identificar delimitador (, ou ;)
    const isOfx = fileName.toLowerCase().endsWith('.ofx');

    const importId = Date.now();
    const today = new Date().toISOString().split('T')[0];

    if (!isOfx) {
      // Processamento de CSV bancário padrão
      // Espera colunas como Data, Descrição, Valor ou similar
      const startIndex = lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('date') ? 1 : 0;
      const delimiter = lines[0].includes(';') ? ';' : ',';

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3) {
          const rawDate = parts[0];
          const desc = parts[1];
          let rawAmount = parts[2].replace('R$', '').replace(/\s/g, '');
          
          if (rawAmount.includes(',') && rawAmount.includes('.')) {
            rawAmount = rawAmount.replace(/\./g, '').replace(',', '.');
          } else if (rawAmount.includes(',')) {
            rawAmount = rawAmount.replace(',', '.');
          }
          
          const amount = parseFloat(rawAmount);
          if (!isNaN(amount) && desc) {
            // Aplicar regras de categorização por palavra-chave
            let matchedCategoryId = null;
            let matchedCategoryName = 'Geral';
            let txType = amount >= 0 ? 'INCOME' : 'EXPENSE';

            const upperDesc = desc.toUpperCase();
            for (const rule of rules) {
              if (upperDesc.includes(rule.keyword)) {
                matchedCategoryId = rule.categoryId;
                const cat = categories.find(c => c.id === rule.categoryId);
                if (cat) {
                  matchedCategoryName = cat.name;
                  txType = cat.type;
                }
                break;
              }
            }

            // Normalizar data (DD/MM/YYYY para YYYY-MM-DD se necessário)
            let formattedDate = rawDate;
            if (rawDate.includes('/')) {
              const dParts = rawDate.split('/');
              if (dParts.length === 3) {
                formattedDate = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
              }
            }

            newTransactions.push({
              id: Date.now() + i,
              importId,
              description: desc,
              amount: Math.abs(amount),
              transactionDate: formattedDate || today,
              categoryId: matchedCategoryId,
              categoryName: matchedCategoryName,
              type: txType,
              manuallyCategorized: false
            });
          }
        }
      }
    } else {
      // OFX Básico
      const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
      let match;
      let count = 0;
      while ((match = trnRegex.exec(text)) !== null) {
        const block = match[1];
        const memoMatch = /<MEMO>(.*?)(?:<|$)/i.exec(block);
        const amtMatch = /<TRNAMT>(.*?)(?:<|$)/i.exec(block);
        const dateMatch = /<DTPOSTED>(\d{8})/i.exec(block);

        const desc = memoMatch ? memoMatch[1].trim() : 'Transação OFX';
        const amount = amtMatch ? parseFloat(amtMatch[1].trim()) : 0;
        let txDate = today;
        if (dateMatch && dateMatch[1]) {
          const dStr = dateMatch[1];
          txDate = `${dStr.substring(0, 4)}-${dStr.substring(4, 6)}-${dStr.substring(6, 8)}`;
        }

        let matchedCategoryId = null;
        let matchedCategoryName = 'Geral';
        let txType = amount >= 0 ? 'INCOME' : 'EXPENSE';

        const upperDesc = desc.toUpperCase();
        for (const rule of rules) {
          if (upperDesc.includes(rule.keyword)) {
            matchedCategoryId = rule.categoryId;
            const cat = categories.find(c => c.id === rule.categoryId);
            if (cat) {
              matchedCategoryName = cat.name;
              txType = cat.type;
            }
            break;
          }
        }

        newTransactions.push({
          id: Date.now() + count++,
          importId,
          description: desc,
          amount: Math.abs(amount),
          transactionDate: txDate,
          categoryId: matchedCategoryId,
          categoryName: matchedCategoryName,
          type: txType,
          manuallyCategorized: false
        });
      }
    }

    // Salvar transações geradas localmente
    const existingTx = JSON.parse(localStorage.getItem('ob_db_transactions') || '[]');
    localStorage.setItem('ob_db_transactions', JSON.stringify([...newTransactions, ...existingTx]));

    // Registrar histórico de importação
    const importRecord = {
      id: importId,
      fileName,
      importDate: new Date().toISOString(),
      status: 'Sucesso',
      transactionCount: newTransactions.length
    };

    const existingImports = JSON.parse(localStorage.getItem('ob_db_imports') || '[]');
    existingImports.unshift(importRecord);
    localStorage.setItem('ob_db_imports', JSON.stringify(existingImports));

    await this.fetchImports();
    eventBus.emit('import:completed', importRecord);
    return importRecord;
  }

  async deleteImport(id) {
    try {
      await apiService.request(`/api/imports/${id}`, { method: 'DELETE' });
      this.imports = this.imports.filter(i => i.id !== id);
      eventBus.emit('import:deleted', id);
      return true;
    } catch (error) {
      console.error('Erro ao excluir importação:', error);
      throw error;
    }
  }
}

export const importModel = new ImportModel();
