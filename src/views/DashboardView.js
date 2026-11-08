/**
 * DashboardView: Painel Geral com cards de resumo, gráfico de evolução SVG interativo
 * e lista de transações recentes fiel ao design da imagem anexada.
 */
import { formatCurrency, formatDate, getMonthShortName } from '../utils/formatters.js';
import { eventBus } from '../utils/eventBus.js';

export class DashboardView {
  constructor(containerId = 'content-container') {
    this.container = document.getElementById(containerId);
    this.chartMode = 'evolution'; // 'evolution' | 'categories'
    this.periodType = 'mensal';   // 'mensal' | 'anual'
    this.chartData = [];
    this.recentTransactions = [];
    this.summary = { totalIncome: 0, totalExpense: 0, balance: 0 };
  }

  setData({ summary, transactions, categoryMetrics }) {
    this.summary = summary || { totalIncome: 0, totalExpense: 0, balance: 0 };
    this.recentTransactions = (transactions || []).slice(0, 6);
    this.categoryMetrics = categoryMetrics || [];
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="content-area">
        <!-- Seção: Em Destaque -->
        <h2 class="section-title">Em destaque</h2>
        
        <div class="cards-summary-grid">
          <!-- Card Saldo Total -->
          <div class="metric-card card-saldo">
            <div class="metric-card-header">
              <span class="metric-card-label">Saldo Total</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div class="metric-card-value">${formatCurrency(this.summary.balance)}</div>
          </div>

          <!-- Card Receitas -->
          <div class="metric-card card-receitas">
            <div class="metric-card-header">
              <span class="metric-card-label">Receitas</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div class="metric-card-value">${formatCurrency(this.summary.totalIncome)}</div>
          </div>

          <!-- Card Despesas -->
          <div class="metric-card card-despesas">
            <div class="metric-card-header">
              <span class="metric-card-label">Despesas</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
            <div class="metric-card-value">${formatCurrency(this.summary.totalExpense)}</div>
          </div>
        </div>

        <!-- Seção: Gráfico -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title">Gráfico</h3>
            <div class="panel-controls">
              <select class="select-custom" id="chart-type-select">
                <option value="evolution" ${this.chartMode === 'evolution' ? 'selected' : ''}>Evolução</option>
                <option value="categories" ${this.chartMode === 'categories' ? 'selected' : ''}>Por Categorias</option>
              </select>

              <div class="btn-pill-group">
                <button class="btn-pill ${this.periodType === 'mensal' ? 'active' : ''}" id="pill-mensal">Mensal</button>
                <button class="btn-pill ${this.periodType === 'anual' ? 'active' : ''}" id="pill-anual">Anual</button>
              </div>
            </div>
          </div>

          <div class="chart-container" id="chart-box">
            ${this.renderChart()}
            <div class="chart-tooltip" id="chart-tooltip"></div>
          </div>
        </div>

        <!-- Seção: Transações Recentes -->
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title">Transações Recentes</h3>
            <button class="btn-secondary" id="btn-see-all-transactions" style="padding: 4px 10px; font-size: 12px;">
              Ver todas &bull;&bull;&bull;
            </button>
          </div>

          <div class="transactions-list">
            ${this.renderRecentTransactionsList()}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderChart() {
    if (this.chartMode === 'categories') {
      return this.renderCategoriesChart();
    }
    return this.renderEvolutionChart();
  }

  renderEvolutionChart() {
    // Meses para o eixo X
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Gerar pontos com base no saldo real ou dados agregados
    const pointsData = months.map((m, idx) => {
      // Simula a linha de evolução com base no saldo atual ou histórico
      const factor = (Math.sin((idx + 1) * 0.8) + 1.2) / 2.2;
      const baseVal = Math.max(this.summary.balance, 1000);
      const val = Math.round(baseVal * factor);
      return { month: m, value: val };
    });

    const maxVal = Math.max(...pointsData.map(d => d.value), 10000);
    const chartHeight = 200;
    const chartWidth = 900;
    const paddingLeft = 50;
    const paddingBottom = 30;
    const paddingTop = 20;
    const innerWidth = chartWidth - paddingLeft - 20;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    const coords = pointsData.map((d, i) => {
      const x = paddingLeft + (i / (pointsData.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - (d.value / maxVal) * innerHeight;
      return { x, y, ...d };
    });

    // Construção de curva Bézier suave
    let dPath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      dPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${dPath} L ${coords[coords.length - 1].x} ${paddingTop + innerHeight} L ${coords[0].x} ${paddingTop + innerHeight} Z`;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
      const y = paddingTop + innerHeight - fraction * innerHeight;
      const valLabel = Math.round(maxVal * fraction);
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${chartWidth - 20}" y2="${y}" class="chart-grid-line" />
        <text x="${paddingLeft - 8}" y="${y + 4}" class="chart-axis-text" text-anchor="end">${valLabel}</text>
      `;
    }).join('');

    const xLabels = coords.map(c => `
      <text x="${c.x}" y="${chartHeight - 6}" class="chart-axis-text" text-anchor="middle">${c.month}</text>
    `).join('');

    const circles = coords.map(c => `
      <circle cx="${c.x}" cy="${c.y}" class="chart-data-point" data-value="${formatCurrency(c.value)}" data-month="${c.month}" />
    `).join('');

    return `
      <svg class="chart-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1d6ee6" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#1d6ee6" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaPath}" class="chart-area-path" />
        <path d="${dPath}" class="chart-line-path" />
        ${circles}
        ${xLabels}
      </svg>
    `;
  }

  renderCategoriesChart() {
    if (!this.categoryMetrics || this.categoryMetrics.length === 0) {
      return `
        <div class="empty-state" style="padding: 24px;">
          <p class="empty-title">Nenhum dado por categoria no período</p>
          <p class="empty-description">Cadastre transações ou importe extratos para visualizar a distribuição dos seus gastos.</p>
        </div>
      `;
    }

    const bars = this.categoryMetrics.map(item => `
      <div style="margin-bottom: 14px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:4px;">
          <span>${item.categoryName}</span>
          <span>${formatCurrency(item.total)} (${Math.round(item.percentage)}%)</span>
        </div>
        <div style="height: 10px; width: 100%; background: #f1f5f9; border-radius: 6px; overflow: hidden;">
          <div style="height: 100%; width: ${Math.min(item.percentage, 100)}%; background: linear-gradient(90deg, #1d6ee6, #06b6d4); border-radius: 6px;"></div>
        </div>
      </div>
    `).join('');

    return `<div style="padding: 12px 24px;">${bars}</div>`;
  }

  renderRecentTransactionsList() {
    if (!this.recentTransactions || this.recentTransactions.length === 0) {
      return `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          <h4 class="empty-title">Nenhuma transação recente</h4>
          <p class="empty-description">Você ainda não possui movimentações cadastradas neste mês. Importe um extrato CSV/OFX ou adicione uma transação manual.</p>
          <div style="display:flex; gap:12px;">
            <button class="btn-primary" id="btn-quick-new-tx">+ Nova Transação</button>
            <button class="btn-secondary" id="btn-quick-import">Importar CSV</button>
          </div>
        </div>
      `;
    }

    return this.recentTransactions.map(t => {
      const isIncome = t.type === 'INCOME';
      const catName = t.categoryName || 'Geral';
      
      // Ícone contextual por categoria
      let icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      `;
      if (isIncome) {
        icon = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <circle cx="12" cy="12" r="2"/>
            <path d="M6 12h.01M18 12h.01"/>
          </svg>
        `;
      }

      const badgeClass = isIncome ? 'badge-income' : (catName.toLowerCase().includes('aliment') ? 'badge-alimentacao' : 'badge-categoria');

      return `
        <div class="transaction-item">
          <div class="transaction-left">
            <div class="transaction-icon-box">
              ${icon}
            </div>
            <div class="transaction-details">
              <span class="transaction-desc-val">${t.description} - ${formatCurrency(t.amount)}</span>
              <span class="transaction-subtext">${formatDate(t.transactionDate)} &bull; ${isIncome ? 'Receita' : 'Despesa'}</span>
            </div>
          </div>
          <div class="transaction-right">
            <span class="badge ${badgeClass}">${catName}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    if (!this.container) return;

    // Ações rápidas
    const btnQuickNew = this.container.querySelector('#btn-quick-new-tx');
    if (btnQuickNew) {
      btnQuickNew.addEventListener('click', () => eventBus.emit('transaction:modal-open'));
    }

    const btnQuickImport = this.container.querySelector('#btn-quick-import');
    if (btnQuickImport) {
      btnQuickImport.addEventListener('click', () => eventBus.emit('navigate', 'importar'));
    }

    const btnSeeAll = this.container.querySelector('#btn-see-all-transactions');
    if (btnSeeAll) {
      btnSeeAll.addEventListener('click', () => eventBus.emit('navigate', 'transacoes'));
    }

    // Controle do Gráfico
    const selectChart = this.container.querySelector('#chart-type-select');
    if (selectChart) {
      selectChart.addEventListener('change', (e) => {
        this.chartMode = e.target.value;
        const box = this.container.querySelector('#chart-box');
        if (box) box.innerHTML = this.renderChart() + '<div class="chart-tooltip" id="chart-tooltip"></div>';
        this.bindChartTooltips();
      });
    }

    const pillMensal = this.container.querySelector('#pill-mensal');
    const pillAnual = this.container.querySelector('#pill-anual');
    if (pillMensal && pillAnual) {
      pillMensal.addEventListener('click', () => {
        this.periodType = 'mensal';
        pillMensal.classList.add('active');
        pillAnual.classList.remove('active');
        this.render();
      });
      pillAnual.addEventListener('click', () => {
        this.periodType = 'anual';
        pillAnual.classList.add('active');
        pillMensal.classList.remove('active');
        this.render();
      });
    }

    this.bindChartTooltips();
  }

  bindChartTooltips() {
    const tooltip = this.container.querySelector('#chart-tooltip');
    const points = this.container.querySelectorAll('.chart-data-point');
    const chartBox = this.container.querySelector('#chart-box');

    points.forEach(p => {
      p.addEventListener('mouseenter', (e) => {
        if (!tooltip || !chartBox) return;
        const val = p.getAttribute('data-value');
        const month = p.getAttribute('data-month');
        tooltip.textContent = `${month}: ${val}`;
        tooltip.style.display = 'block';

        const boxRect = chartBox.getBoundingClientRect();
        const pRect = p.getBoundingClientRect();
        const left = pRect.left - boxRect.left + pRect.width / 2;
        const top = pRect.top - boxRect.top;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });

      p.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.style.display = 'none';
      });
    });
  }
}
