/**
 * UserModel: Gerencia estado da conta do usuário e autenticação JWT.
 */
import { apiService } from './ApiService.js';
import { eventBus } from '../utils/eventBus.js';

class UserModel {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = !!apiService.getToken();
  }

  async login(email, password) {
    try {
      const response = await apiService.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const token = response.token || response;
      if (token) {
        apiService.setToken(token);
        this.isAuthenticated = true;
        await this.loadUserProfile();
        eventBus.emit('auth:changed', this.currentUser);
        return { success: true };
      }
      throw new Error('Token não retornado pelo servidor.');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(name, email, password) {
    try {
      const response = await apiService.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (response && response.token) {
        apiService.setToken(response.token);
        this.isAuthenticated = true;
        await this.loadUserProfile();
        eventBus.emit('auth:changed', this.currentUser);
      }
      return { success: true, message: response.message || 'Cadastro realizado com sucesso!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadUserProfile() {
    try {
      if (!apiService.getToken()) {
        this.currentUser = null;
        this.isAuthenticated = false;
        return null;
      }
      const data = await apiService.request('/api/users/me', { method: 'GET' });
      this.currentUser = data || { name: 'Usuário', email: '' };
      this.isAuthenticated = true;
      eventBus.emit('user:loaded', this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.warn('Erro ao carregar perfil do usuário:', error.message);
      this.currentUser = { name: 'Visitante', email: '' };
      return this.currentUser;
    }
  }

  logout() {
    apiService.clearAuth();
    this.currentUser = null;
    this.isAuthenticated = false;
    eventBus.emit('auth:changed', null);
  }

  getUser() {
    return this.currentUser;
  }
}

export const userModel = new UserModel();
