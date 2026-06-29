import { Customer, Expense } from '../types';

const CUSTOMERS_KEY = 'jarBiz_v2';
const STOCK_KEY = 'jarBiz_stock';
const EXPENSES_KEY = 'jarBiz_kharche';

export function loadCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error('Error saving customers:', error);
  }
}

export function loadStock(): number {
  try {
    const val = localStorage.getItem(STOCK_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch (error) {
    console.error('Error loading stock:', error);
    return 0;
  }
}

export function saveStock(val: number): void {
  try {
    localStorage.setItem(STOCK_KEY, String(val));
  } catch (error) {
    console.error('Error saving stock:', error);
  }
}

export function loadExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading expenses:', error);
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving expenses:', error);
  }
}
