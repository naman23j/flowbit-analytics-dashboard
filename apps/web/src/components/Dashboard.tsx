'use client';

import { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import DecorativeDonut from './DecorativeDonut';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Search, ChevronUp, ChevronDown } from 'lucide-react';
import {
  fetchStats,
  fetchInvoiceTrends,
  fetchTopVendors,
  fetchCategorySpend,
  fetchCashOutflow,
  fetchInvoices,
  type Stats,
  type InvoiceTrend,
  type Vendor,
  type CategorySpend,
  type CashOutflow,
  type Invoice,
} from '@/lib/api';
import { formatCurrency, formatNumber, formatMonth, formatDate } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Custom plugin for vendor chart background strips
const vendorBackgroundPlugin = {
  id: 'vendorBackground',
  beforeDatasetsDraw: (chart: any) => {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.y) return;
    
    const yAxis = scales.y;
    const barHeight = 25; // Match barThickness
    
    ctx.save();
    yAxis.ticks.forEach((_: any, index: number) => {
      const y = yAxis.getPixelForTick(index);
      
      ctx.fillStyle = 'rgba(233, 236, 241, 0.82)';
      ctx.beginPath();
      ctx.roundRect(
        chartArea.left,
        y - barHeight / 2,
        chartArea.right - chartArea.left,
        barHeight,
        4 // border-radius
      );
      ctx.fill();
    });
    ctx.restore();
  },
};

// Custom plugin for cash flow chart background bars
const cashFlowBackgroundPlugin = {
  id: 'cashFlowBackground',
  beforeDatasetsDraw: (chart: any) => {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.x) return;
    
    const xAxis = scales.x;
    const barWidth = 60; // Specified width
    
    ctx.save();
    xAxis.ticks.forEach((_: any, index: number) => {
      const x = xAxis.getPixelForTick(index);
      
      ctx.fillStyle = 'rgba(237, 239, 244, 1)';
      ctx.beginPath();
      ctx.roundRect(
        x - barWidth / 2,
        chartArea.top,
        barWidth,
        chartArea.bottom - chartArea.top,
        10 // border-radius
      );
      ctx.fill();
    });
    ctx.restore();
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<InvoiceTrend[]>([]);
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [cashOutflow, setCashOutflow] = useState<CashOutflow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'vendor' | 'amount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, trendsData, vendorsData, categoriesData, cashOutflowData, invoicesData] = await Promise.all([
        fetchStats(),
        fetchInvoiceTrends(12),
        fetchTopVendors(),
        fetchCategorySpend(),
        fetchCashOutflow(6),
        fetchInvoices(1, 50, searchTerm, statusFilter),
      ]);

      setStats(statsData);
      setTrends(trendsData);
      setTopVendors(vendorsData);
      setCategorySpend(categoriesData);
      setCashOutflow(cashOutflowData);
      setInvoices(invoicesData.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort invoices
  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case 'vendor':
          comparison = a.vendor.name.localeCompare(b.vendor.name);
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'date' | 'vendor' | 'amount' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart configurations
  // Sample data for line chart when database has insufficient data (matching Figma design)
  const sampleInvoiceData = [12, 62, 45, 52, 28, 18, 32, 47, 38, 47, 35, 22];
  const sampleSpendData = [8, 55, 42, 48, 25, 16, 28, 42, 32, 8.679, 30, 18];
  
  // Use sample data if trends are empty or have less than 12 months
  const hasFullYearData = trends.length === 12;
  const invoiceCountData = hasFullYearData 
    ? trends.map((t) => t.invoiceCount)
    : sampleInvoiceData;
  const spendData = hasFullYearData
    ? trends.map((t) => t.totalSpend / 1000)
    : sampleSpendData;
  
  // Calculate max value for dynamic scaling
  const maxInvoiceCount = Math.max(...invoiceCountData, 0);
  const maxSpend = Math.max(...spendData, 0);
  const maxValue = Math.max(maxInvoiceCount, maxSpend);
  
  // Determine appropriate Y-axis scale
  let yAxisMax = 80;
  let yAxisStep = 20;
  
  if (maxValue <= 10) {
    yAxisMax = 20;
    yAxisStep = 5;
  } else if (maxValue <= 20) {
    yAxisMax = 40;
    yAxisStep = 10;
  } else if (maxValue <= 40) {
    yAxisMax = 60;
    yAxisStep = 15;
  } else {
    yAxisMax = 80;
    yAxisStep = 20;
  }
  
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Invoice Count',
        data: invoiceCountData,
        borderColor: '#859ef2ff',
        backgroundColor: 'rgba(133, 158, 242, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#5268b0ff',
        borderWidth: 2,
      },
      {
        label: 'Total Spend',
        data: spendData,
        borderColor: '#1d1665',
        backgroundColor: 'rgba(29, 22, 101, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1d1665',
        borderWidth: 3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: 'rgba(228, 228, 231, 1)',
        borderWidth: 1,
        padding: 16,
        borderRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return context[0].label + ' 2025';
          },
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return 'Invoice count: ' + context.parsed.y;
            } else {
              return 'Total Spend: € ' + (context.parsed.y * 1000).toLocaleString();
            }
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: yAxisMax,
        ticks: {
          stepSize: yAxisStep,
          callback: function(value: any) {
            return value;
          },
          font: {
            size: 12,
          },
          color: '#6B7280',
        },
        grid: {
          color: 'rgba(228, 228, 231, 0.5)',
          drawBorder: false,
        },
        border: {
          display: false,
        }
      },
      x: {
        grid: {
          display: true,
          drawBorder: false,
          color: function(context: any) {
            // Gradient background bars for all months
            const gradientColors = [
              'rgba(228, 228, 231, 0.15)', // Jan - lightest
              'rgba(220, 220, 235, 0.18)',  // Feb
              'rgba(210, 210, 238, 0.20)',  // Mar
              'rgba(200, 200, 240, 0.22)',  // Apr
              'rgba(190, 195, 235, 0.24)',  // May
              'rgba(185, 190, 235, 0.25)',  // Jun
              'rgba(185, 190, 235, 0.26)',  // Jul
              'rgba(185, 195, 238, 0.28)',  // Aug
              'rgba(180, 190, 235, 0.29)',  // Sep
              'rgba(180, 190, 230, 0.35)',  // Oct - highlighted
              'rgba(190, 195, 235, 0.27)',  // Nov
              'rgba(200, 200, 238, 0.20)',  // Dec
            ];
            return gradientColors[context.index] || 'rgba(228, 228, 231, 0.15)';
          },
          lineWidth: 35,  // Reduced width to create gaps between bars
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#6B7280',
        },
        border: {
          display: false,
        }
      },
    },
  };

  // Top 10 vendors by spend (API already returns sorted top 10)
  // Filter out vendors with zero spend for cleaner visualization
  const top10Vendors = topVendors.filter(v => v.totalSpend > 0).slice(0, 10);
  
  // Calculate max spend for dynamic x-axis scaling
  const maxVendorSpend = top10Vendors.length > 0 ? Math.max(...top10Vendors.map(v => v.totalSpend)) : 1000;
  const xAxisMax = Math.ceil(maxVendorSpend / 10000) * 10000 || 45000; // Round up to nearest 10k
  const xAxisStep = xAxisMax / 3; // 3 steps for clean visualization
  
  const vendorBarData = {
    labels: top10Vendors.map((v) => v.name.split(' ')[0]),
    datasets: [
      {
        label: 'Vendor Spend',
        data: top10Vendors.map((v) => v.totalSpend),
        backgroundColor: 'rgba(189, 188, 214, 1)', // Single color for all bars
        hoverBackgroundColor: '#1d1665',
        borderRadius: 4,
        barThickness: 25,
      },
    ],
  };

  const vendorBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 0,
        bottom: 0,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        callbacks: {
          label: function(context: any) {
            return '€' + context.parsed.x.toLocaleString();
          }
        }
      },
    },
    scales: {
      x: {
        min: 0,
        max: xAxisMax,
        ticks: {
          stepSize: xAxisStep,
          callback: function(value: any) {
            if (value >= 1000) {
              return '€' + Math.round(value / 1000) + 'k';
            }
            return '€' + value;
          },
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 2,
        }
      },
    },
    categoryPercentage: 0.95,
    barPercentage: 0.98,
  };

  const doughnutData = {
    labels: categorySpend.map(cat => cat.category),
    datasets: [
      {
        data: categorySpend.map(cat => cat.totalSpend),
        backgroundColor: [
          'rgba(43, 77, 237, 1)',    // Operations - Blue #2B4DED
          'rgba(255, 158, 105, 1)',   // Marketing - Orange #FF9E69
          'rgba(255, 209, 167, 1)',   // Facilities - Peach #FFD1A7
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  // Cash Outflow by day ranges (matching Figma design)
  // If no real data, show sample data from Figma
  const cashFlowData = {
    labels: ['0-7 days', '8-30 days', '31-60 days', '60+ days'],
    datasets: [
      {
        label: 'Expected Outflow',
        data: cashOutflow.length > 0 
          ? [
              cashOutflow[0]?.expectedOutflow || 44,  // 0-7 days
              cashOutflow[1]?.expectedOutflow || 30,  // 8-30 days
              cashOutflow[2]?.expectedOutflow || 20,  // 31-60 days
              cashOutflow[3]?.expectedOutflow || 65,  // 60+ days
            ]
          : [44, 30, 65, 20],  // Sample data from Figma when no real data
        backgroundColor: 'rgba(27, 20, 100, 1)',  // Dark violet color
        borderRadius: 4,
        barThickness: 60,
      },
    ],
  };

  const cashFlowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        callbacks: {
          label: function(context: any) {
            return '€' + context.parsed.y + 'k';
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 70,
        ticks: {
          stepSize: 10,
          callback: function(value: any) {
            return '€' + value + 'k';
          },
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
        grid: {
          color: 'rgba(228, 228, 231, 0.5)',
          drawBorder: false,
        },
        border: {
          display: false,
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
        border: {
          display: false,
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards - Total Width: 1164px, Height: 120px, Gap: 14px */}
      <div className="flex" style={{ width: '1164px', height: '120px', gap: '14px' }}>
        <div className="bg-white rounded-lg shadow-sm p-4 flex-1" style={{ height: '120px', border: '1px solid rgba(228, 228, 231, 1)' }}>
          <div className="flex flex-col h-full">
            <div className="mb-1">
              <p className="text-xs text-gray-600 mb-0.5">Total Spend</p>
              <p className="text-[10px] text-gray-400">(YTD)</p>
            </div>
            <div className="flex justify-between items-end flex-1">
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  € {formatNumber(stats?.totalSpend || 12679.25)}
                </p>
                <div className="flex items-center text-xs font-medium text-green-600">
                  <span>+8.2%</span>
                  <span className="text-gray-400 font-normal ml-1.5">from last month</span>
                </div>
              </div>
              {/* Mini trend chart SVG - bottom right aligned */}
              <svg width="50" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
                <path d="M0 16C6 16 6 9 12 9C18 9 18 3 24 3C30 3 30 7 36 7C42 7 45 5 50 4" 
                      stroke="#10B981" 
                      strokeWidth="1.5" 
                      fill="none" 
                      strokeLinecap="round"/>
                <path d="M0 16C6 16 6 9 12 9C18 9 18 3 24 3C30 3 30 7 36 7C42 7 45 5 50 4L50 24L0 24Z" 
                      fill="url(#green-gradient)" 
                      opacity="0.2"/>
                <defs>
                  <linearGradient id="green-gradient" x1="25" y1="3" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10B981"/>
                    <stop offset="1" stopColor="#10B981" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 flex-1" style={{ height: '120px', border: '1px solid rgba(228, 228, 231, 1)' }}>
          <div className="flex flex-col h-full">
            <div className="mb-1">
              <p className="text-xs text-gray-600 mb-0.5">Total Invoices Processed</p>
            </div>
            <div className="flex justify-between items-end flex-1">
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stats?.totalInvoices || 64}
                </p>
                <div className="flex items-center text-xs font-medium text-green-600">
                  <span>+8.2%</span>
                  <span className="text-gray-400 font-normal ml-1.5">from last month</span>
                </div>
              </div>
              {/* Mini trend chart SVG - bottom right aligned */}
              <svg width="50" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
              <path d="M0 14C8 14 8 6 16 6C24 6 24 10 32 10C40 10 40 4 50 4" 
                    stroke="#10B981" 
                    strokeWidth="1.5" 
                    fill="none" 
                    strokeLinecap="round"/>
              <path d="M0 14C8 14 8 6 16 6C24 6 24 10 32 10C40 10 40 4 50 4L50 24L0 24Z" 
                    fill="url(#green-gradient-2)" 
                    opacity="0.2"/>
              <defs>
                <linearGradient id="green-gradient-2" x1="25" y1="4" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10B981"/>
                  <stop offset="1" stopColor="#10B981" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 flex-1" style={{ height: '120px', border: '1px solid rgba(228, 228, 231, 1)' }}>
          <div className="flex flex-col h-full">
            <div className="mb-1">
              <p className="text-xs text-gray-600 mb-0.5">Documents Uploaded</p>
              <p className="text-[10px] text-gray-400">This Month</p>
            </div>
            <div className="flex justify-between items-end flex-1">
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">17</p>
                <div className="flex items-center text-xs font-medium text-red-600">
                  <span>-8.2%</span>
                  <span className="text-gray-400 font-normal ml-1.5">from last month</span>
                </div>
              </div>
              {/* Mini trend chart SVG - Downward trend, bottom right aligned */}
              <svg width="50" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
              <path d="M0 6C8 6 8 14 16 14C24 14 24 9 32 9C40 9 40 17 50 17" 
                    stroke="#EF4444" 
                    strokeWidth="1.5" 
                    fill="none" 
                    strokeLinecap="round"/>
              <path d="M0 6C8 6 8 14 16 14C24 14 24 9 32 9C40 9 40 17 50 17L50 24L0 24Z" 
                    fill="url(#red-gradient)" 
                    opacity="0.2"/>
              <defs>
                <linearGradient id="red-gradient" x1="25" y1="6" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EF4444"/>
                  <stop offset="1" stopColor="#EF4444" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 flex-1" style={{ height: '120px', border: '1px solid rgba(228, 228, 231, 1)' }}>
          <div className="flex flex-col h-full">
            <div className="mb-1">
              <p className="text-xs text-gray-600 mb-0.5">Average Invoice Value</p>
            </div>
            <div className="flex justify-between items-end flex-1">
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  € {formatNumber(stats?.avgInvoiceValue || 2455)}
                </p>
                <div className="flex items-center text-xs font-medium text-green-600">
                  <span>+8.2%</span>
                  <span className="text-gray-400 font-normal ml-1.5">from last month</span>
                </div>
              </div>
              {/* Mini trend chart SVG - bottom right aligned */}
              <svg width="50" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
              <path d="M0 17C10 17 10 7 20 7C30 7 30 12 40 12C45 12 47.5 9 50 6" 
                    stroke="#10B981" 
                    strokeWidth="1.5" 
                    fill="none" 
                    strokeLinecap="round"/>
              <path d="M0 17C10 17 10 7 20 7C30 7 30 12 40 12C45 12 47.5 9 50 6L50 24L0 24Z" 
                    fill="url(#green-gradient-3)" 
                    opacity="0.2"/>
              <defs>
                <linearGradient id="green-gradient-3" x1="25" y1="6" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10B981"/>
                  <stop offset="1" stopColor="#10B981" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Volume Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E4E4E7]" style={{ padding: '16px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Invoice Volume + Value Trend
            </h3>
            <p className="text-sm text-gray-500">
              Invoice count and total spend over 12 months.
            </p>
          </div>
          <div style={{ height: '371px' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">October 2025</p>
                <p className="text-xs text-gray-500 mt-1">Invoice count: <span className="font-semibold text-blue-600">47</span></p>
                <p className="text-xs text-gray-500">Total Spend: <span className="font-semibold text-blue-600">€ 8,679.25</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Vendors Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Spend by Vendor (Top 10)
            </h3>
            <p className="text-sm text-gray-500">
              Vendor spend with cumulative percentage distribution.
            </p>
          </div>
          <div className="h-80">
            <Bar data={vendorBarData} options={vendorBarOptions} plugins={[vendorBackgroundPlugin]} />
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {top10Vendors.length > 0 ? top10Vendors[0].name : 'No vendors'}
              </p>
              <p className="text-sm font-semibold text-blue-600">
                € {top10Vendors.length > 0 ? formatNumber(top10Vendors[0].totalSpend) : '0'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Top Vendor Spend</p>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Spend */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Spend by Category
            </h3>
            <p className="text-sm text-gray-500">
              Distribution of spending across different categories.
            </p>
          </div>
          <div className="flex items-center justify-center" style={{ position: 'relative', paddingTop: '23px', paddingLeft: '23px' }}>
            <div style={{ width: '192.5px', height: '192.5px', position: 'relative' }}>
              {/* Decorative SVG aligned as in Figma/photo */}
              <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <DecorativeDonut width={192.5} height={192.5} />
              </div>
              <div style={{ width: '192.5px', height: '192.5px', visibility: 'hidden' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {categorySpend.map((cat, index) => {
              const colors = ['#2B4DED', '#FF9E69', '#FFD1A7'];
              return (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index] }}></div>
                    <span className="text-sm text-gray-700">{cat.category}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${cat.totalSpend.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cash Outflow Forecast */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Cash Outflow Forecast
            </h3>
            <p className="text-sm text-gray-500">
              Expected payment obligations grouped by due date ranges.
            </p>
          </div>
          <div className="h-64 ">
            <Bar data={cashFlowData} options={cashFlowOptions} plugins={[cashFlowBackgroundPlugin]} />
          </div>
        </div>

        {/* Invoices by Vendor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100" style={{ padding: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#09090B', marginBottom: '4px' }}>
              Invoices by Vendor
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#71717A', lineHeight: '20px' }}>
              Top vendors by invoice count and net value.
            </p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '400px', marginTop: '16px' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    paddingBottom: '12px',
                    paddingTop: '8px',
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#09090B',
                  }}>
                    Vendor
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    paddingBottom: '12px',
                    paddingTop: '8px',
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#09090B',
                  }}>
                    # Invoices
                  </th>
                  <th style={{ 
                    textAlign: 'right', 
                    paddingBottom: '12px',
                    paddingTop: '8px',
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: '#09090B',
                  }}>
                    Net Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 8).map((invoice, index) => (
                  <tr key={invoice.id} style={{ borderBottom: index < 7 ? '1px solid #F4F4F5' : 'none' }}>
                    <td style={{ 
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      fontSize: '13px', 
                      fontWeight: 600,
                      color: '#09090B',
                    }}>
                      {invoice.vendor.name}
                    </td>
                    <td style={{ 
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      fontSize: '12px', 
                      fontWeight: 400,
                      color: '#09090B',
                    }}>
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td style={{ 
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: '#09090B',
                      textAlign: 'right',
                    }}>
                      € {formatNumber(invoice.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
              <p className="text-sm text-gray-500 mt-1">
                Searchable and sortable invoice list
              </p>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by vendor or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('vendor')}
                  >
                    <div className="flex items-center gap-1">
                      Vendor
                      {sortField === 'vendor' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAndSortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No invoices found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.vendor.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(invoice.issueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          € {formatNumber(invoice.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Footer with Count */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAndSortedInvoices.length}</span> of{' '}
            <span className="font-semibold">{invoices.length}</span> invoices
          </p>
        </div>
      </div>
    </div>
  );
}
