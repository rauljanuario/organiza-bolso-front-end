/**
 * Utilitários de formatação para moedas, datas e números.
 */

export function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) {
    value = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  // Handles YYYY-MM-DD or ISO strings without timezone shift issues
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
}

export function getMonthName(monthNumber) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(monthNumber, 10) - 1;
  return months[idx] || '';
}

export function getMonthShortName(monthNumber) {
  const shortMonths = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const idx = parseInt(monthNumber, 10) - 1;
  return shortMonths[idx] || '';
}

export function padZero(num) {
  return String(num).padStart(2, '0');
}
