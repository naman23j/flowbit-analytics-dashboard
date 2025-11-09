import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Response Types
export interface Stats {
  totalInvoices: number;
  totalSpend: number;
  uniqueVendors: number;
  avgInvoiceValue: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export interface Vendor {
  id: string;
  name: string;
  invoiceCount: number;
  totalSpend: number;
}

export interface InvoiceTrend {
  month: string;
  invoiceCount: number;
  totalSpend: number;
  avgInvoiceValue: number;
}

export interface CategorySpend {
  category: string;
  totalSpend: number;
  invoiceCount: number;
  percentage: number;
}

export interface CashOutflow {
  month: string;
  expectedOutflow: number;
  overdueAmount: number;
  totalOutflow: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  status: string;
  category: string | null;
  vendor: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  } | null;
}

export interface PaginatedInvoices {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ChatResponse {
  question: string;
  sql: string;
  results: any[];
  rowCount: number;
  timestamp: string;
}

// API Functions
export const fetchStats = async (): Promise<Stats> => {
  const { data } = await api.get('/stats');
  return data;
};

export const fetchInvoiceTrends = async (months: number = 12): Promise<InvoiceTrend[]> => {
  const { data } = await api.get(`/invoice-trends?months=${months}`);
  return data;
};

export const fetchTopVendors = async (): Promise<Vendor[]> => {
  const { data } = await api.get('/vendors/top10');
  return data;
};

export const fetchCategorySpend = async (): Promise<CategorySpend[]> => {
  const { data } = await api.get('/category-spend');
  return data;
};

export const fetchCashOutflow = async (months: number = 6): Promise<CashOutflow[]> => {
  const { data } = await api.get(`/cash-outflow?months=${months}`);
  return data;
};

export const fetchInvoices = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  status: string = ''
): Promise<PaginatedInvoices> => {
  const { data } = await api.get('/invoices', {
    params: { page, limit, search, status },
  });
  return data;
};

export const chatWithData = async (question: string): Promise<ChatResponse> => {
  const { data } = await api.post('/chat-with-data', { question });
  return data;
};
