/**
 * Ponto de entrada JavaScript puro da aplicação Organiza Bolso.
 * Arquitetura MVC limpa sem frameworks pesados.
 */
import { AppController } from './controllers/AppController.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init().catch(err => {
    console.error('Falha na inicialização do Organiza Bolso:', err);
  });
});
