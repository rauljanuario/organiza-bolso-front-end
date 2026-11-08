import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, formatDate, getMonthName, getMonthShortName, padZero } from '../src/utils/formatters.js';

test('formatCurrency formats values in BRL currency format', () => {
  const formatted = formatCurrency(5430.20);
  assert.match(formatted, /5\.430,20/);
});

test('formatCurrency handles 0 and invalid numbers gracefully', () => {
  const zeroFormatted = formatCurrency(0);
  assert.match(zeroFormatted, /0,00/);

  const nullFormatted = formatCurrency(null);
  assert.match(nullFormatted, /0,00/);
});

test('formatDate converts YYYY-MM-DD to DD/MM/YYYY', () => {
  assert.equal(formatDate('2026-08-25'), '25/08/2026');
  assert.equal(formatDate('2026-11-08'), '08/11/2026');
});

test('getMonthName returns correct month in Portuguese', () => {
  assert.equal(getMonthName('08'), 'Agosto');
  assert.equal(getMonthName(8), 'Agosto');
  assert.equal(getMonthName(1), 'Janeiro');
  assert.equal(getMonthName(12), 'Dezembro');
});

test('padZero pads numbers to 2 digits', () => {
  assert.equal(padZero(5), '05');
  assert.equal(padZero('8'), '08');
  assert.equal(padZero(12), '12');
});

test('keyword categorization matching algorithm logic', () => {
  const rules = [
    { keyword: 'UBER', categoryId: 10, categoryName: 'Transporte', priority: 1 },
    { keyword: 'IFOOD', categoryId: 20, categoryName: 'Alimentação', priority: 1 },
    { keyword: 'POSTO', categoryId: 30, categoryName: 'Combustível', priority: 2 }
  ];

  function matchCategory(description) {
    const upper = (description || '').toUpperCase();
    for (const rule of rules) {
      if (upper.includes(rule.keyword)) {
        return rule;
      }
    }
    return null;
  }

  const match1 = matchCategory('PAGAMENTO *UBER *TRIP BR');
  assert.ok(match1);
  assert.equal(match1.categoryName, 'Transporte');

  const match2 = matchCategory('IFOOD.COM RESTAURANTE');
  assert.ok(match2);
  assert.equal(match2.categoryName, 'Alimentação');

  const match3 = matchCategory('POSTO IPIRANGA CIDADE');
  assert.ok(match3);
  assert.equal(match3.categoryName, 'Combustível');

  const match4 = matchCategory('COMPRA LOJA DESCONHECIDA');
  assert.equal(match4, null);
});
