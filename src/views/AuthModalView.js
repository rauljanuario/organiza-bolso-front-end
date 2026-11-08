/**
 * AuthModalView: Modal de Autenticação JWT com abas para Entrar (Login) e Cadastrar (Register).
 */
import { userModel } from '../models/UserModel.js';
import { eventBus } from '../utils/eventBus.js';
import { toastView } from './ToastView.js';

export class AuthModalView {
  constructor() {
    this.overlay = document.getElementById('auth-modal-overlay');
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'auth-modal-overlay';
      this.overlay.className = 'modal-overlay';
      document.body.appendChild(this.overlay);
    }
    this.activeTab = 'login'; // 'login' | 'register'
  }

  open(defaultTab = 'login') {
    this.activeTab = defaultTab;
    this.render();
    this.overlay.classList.add('open');
  }

  close() {
    this.overlay.classList.remove('open');
    this.overlay.innerHTML = '';
  }

  render() {
    this.overlay.innerHTML = `
      <div class="modal-container" style="max-width: 420px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:24px; height:24px; border-radius:6px; background:#1d6ee6; display:flex; align-items:center; justify-content:center; color:white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            </div>
            <h3 class="modal-title">Organiza Bolso</h3>
          </div>
          <button class="modal-close-btn" id="auth-close-btn">&times;</button>
        </div>

        <div style="padding: 16px 24px 0 24px;">
          <div class="btn-pill-group" style="width: 100%;">
            <button class="btn-pill ${this.activeTab === 'login' ? 'active' : ''}" id="tab-login" style="flex:1;">Entrar</button>
            <button class="btn-pill ${this.activeTab === 'register' ? 'active' : ''}" id="tab-register" style="flex:1;">Criar Conta</button>
          </div>
        </div>

        <div class="modal-body" style="padding-top: 16px;">
          <div id="auth-error-msg" style="display:none; padding:10px; border-radius:6px; background:#fef2f2; border:1px solid #fecaca; color:#dc2626; font-size:12px;"></div>

          ${this.activeTab === 'login' ? this.renderLoginForm() : this.renderRegisterForm()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderLoginForm() {
    return `
      <form id="form-login" style="display:flex; flex-direction:column; gap:14px;">
        <div class="form-group">
          <label class="form-label" for="login-email">E-mail</label>
          <input type="email" class="form-input" id="login-email" required placeholder="seu@email.com" />
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Senha</label>
          <input type="password" class="form-input" id="login-password" required placeholder="Sua senha" />
        </div>

        <button type="submit" class="btn-primary" id="btn-submit-auth" style="justify-content:center; margin-top:6px;">
          Entrar na Conta
        </button>
      </form>
    `;
  }

  renderRegisterForm() {
    return `
      <form id="form-register" style="display:flex; flex-direction:column; gap:14px;">
        <div class="form-group">
          <label class="form-label" for="reg-name">Nome Completo</label>
          <input type="text" class="form-input" id="reg-name" required placeholder="Ex: Raul Januário" />
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-email">E-mail</label>
          <input type="email" class="form-input" id="reg-email" required placeholder="seu@email.com" />
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-password">Senha</label>
          <input type="password" class="form-input" id="reg-password" required placeholder="Defina uma senha" minlength="4" />
        </div>

        <button type="submit" class="btn-primary" id="btn-submit-auth" style="justify-content:center; margin-top:6px;">
          Cadastrar Nova Conta
        </button>
      </form>
    `;
  }

  bindEvents() {
    const closeBtn = this.overlay.querySelector('#auth-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    const tabLogin = this.overlay.querySelector('#tab-login');
    const tabRegister = this.overlay.querySelector('#tab-register');

    if (tabLogin) {
      tabLogin.addEventListener('click', () => {
        this.activeTab = 'login';
        this.render();
      });
    }

    if (tabRegister) {
      tabRegister.addEventListener('click', () => {
        this.activeTab = 'register';
        this.render();
      });
    }

    // Formulário de Login
    const formLogin = this.overlay.querySelector('#form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = this.overlay.querySelector('#login-email').value.trim();
        const password = this.overlay.querySelector('#login-password').value;
        const submitBtn = this.overlay.querySelector('#btn-submit-auth');
        const errBox = this.overlay.querySelector('#auth-error-msg');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';
        errBox.style.display = 'none';

        const result = await userModel.login(email, password);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar na Conta';

        if (result.success) {
          toastView.success('Login efetuado com sucesso!');
          this.close();
          eventBus.emit('data:reload');
        } else {
          errBox.textContent = result.error || 'Credenciais inválidas.';
          errBox.style.display = 'block';
        }
      });
    }

    // Formulário de Registro
    const formRegister = this.overlay.querySelector('#form-register');
    if (formRegister) {
      formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = this.overlay.querySelector('#reg-name').value.trim();
        const email = this.overlay.querySelector('#reg-email').value.trim();
        const password = this.overlay.querySelector('#reg-password').value;
        const submitBtn = this.overlay.querySelector('#btn-submit-auth');
        const errBox = this.overlay.querySelector('#auth-error-msg');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Cadastrando...';
        errBox.style.display = 'none';

        const result = await userModel.register(name, email, password);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Nova Conta';

        if (result.success) {
          toastView.success(result.message || 'Cadastro realizado com sucesso!');
          this.close();
          eventBus.emit('data:reload');
        } else {
          errBox.textContent = result.error || 'Erro ao realizar cadastro.';
          errBox.style.display = 'block';
        }
      });
    }
  }
}

export const authModalView = new AuthModalView();
