'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Database, AlertCircle, Download, Trash2, History, BarChart3 } from 'lucide-react';
import { chatWithData, type ChatResponse } from '@/lib/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const CHAT_HISTORY_KEY = 'flowbit_chat_history';
const MAX_HISTORY = 50;

interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: any[];
}

export default function ChatWithData() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      try {
        setResponses(JSON.parse(saved).slice(0, MAX_HISTORY));
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (responses.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(responses));
    }
  }, [responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await chatWithData(question);
      setResponses([response, ...responses]);
      setQuestion('');
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.response?.data?.message || 'Failed to process your question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all chat history?')) {
      setResponses([]);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  const generateChartConfig = (data: any[]): ChartConfig | null => {
    if (!data || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    if (keys.length < 2) return null;

    const labelKey = keys.find(k => 
      typeof data[0][k] === 'string' || 
      k.toLowerCase().includes('name') || 
      k.toLowerCase().includes('vendor') ||
      k.toLowerCase().includes('category') ||
      k.toLowerCase().includes('month') ||
      k.toLowerCase().includes('date')
    ) || keys[0];

    const valueKeys = keys.filter(k => 
      k !== labelKey && typeof data[0][k] === 'number'
    );

    if (valueKeys.length === 0) return null;

    const labels = data.map(row => String(row[labelKey])).slice(0, 15);
    
    const colors = [
      'rgba(27, 20, 100, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(251, 146, 60, 0.8)',
    ];

    const datasets = valueKeys.map((key, idx) => ({
      label: key.replace(/_/g, ' ').toUpperCase(),
      data: data.slice(0, 15).map(row => Number(row[key]) || 0),
      backgroundColor: colors[idx % colors.length],
      borderColor: colors[idx % colors.length].replace('0.8', '1'),
      borderWidth: 2,
    }));

    const chartType: 'bar' | 'line' | 'pie' = 
      data.length <= 6 ? 'pie' : 
      valueKeys.some(k => k.toLowerCase().includes('trend') || k.toLowerCase().includes('time')) ? 'line' : 
      'bar';

    return { type: chartType, labels, datasets };
  };

  const toggleChart = (index: number) => {
    setShowCharts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const exportToCSV = (response: ChatResponse) => {
    if (response.results.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(response.results[0]);
    const csvRows = [
      headers.join(','),
      ...response.results.map(row => 
        headers.map(header => {
          const val = String(row[header]);
          return val.includes(',') || val.includes('"') 
            ? `"${val.replace(/"/g, '""')}"` 
            : val;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `results_${Date.now()}.csv`;
    link.click();
  };

  const exampleQuestions = [
    'Show top 5 vendors by spend',
    'What is the total spend in the last 90 days?',
    'How many invoices are overdue?',
    'Show me all pending invoices',
    'What is the average invoice value?',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Chat with Your Data
              </h2>
              <p className="text-gray-600 mb-4">
                Ask questions about your invoices, vendors, and spending in natural language.
                Our AI will convert your question to SQL and return the results.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Try asking:</span>
                {exampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(q)}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {responses.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>
        
        {responses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <History className="w-4 h-4" />
              <span>{responses.length} queries in history (auto-saved)</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Your Question
            </label>
            <div className="flex gap-3">
              <input
                id="question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What are the top 10 vendors by total spend?"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="space-y-4">
        {responses.map((response, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-700">Question:</h3>
              <p className="text-base text-gray-900 mt-1">{response.question}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(response.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Generated SQL:</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-green-400 font-mono">{response.sql}</code>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Results ({response.rowCount} rows)
                </h3>
                
                <div className="flex items-center gap-2">
                  {response.results.length > 0 && generateChartConfig(response.results) && (
                    <button
                      onClick={() => toggleChart(idx)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                    >
                      <BarChart3 className="w-4 h-4" />
                      {showCharts[idx] ? 'Hide Chart' : 'Show Chart'}
                    </button>
                  )}
                  {response.results.length > 0 && (
                    <button
                      onClick={() => exportToCSV(response)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              {response.results.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No results found.</p>
              ) : (
                <>
                  {showCharts[idx] && (() => {
                    const chartConfig = generateChartConfig(response.results);
                    if (!chartConfig) return null;

                    const chartOptions = {
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: response.question,
                          font: { size: 14, weight: 'bold' as const },
                        },
                      },
                      scales: chartConfig.type !== 'pie' ? {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                              if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
                              return '$' + value;
                            }
                          }
                        }
                      } : undefined,
                    };

                    return (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div style={{ maxWidth: '800px', margin: '0 auto', height: '400px' }}>
                          {chartConfig.type === 'bar' && (
                            <Bar data={chartConfig} options={chartOptions} />
                          )}
                          {chartConfig.type === 'line' && (
                            <Line data={chartConfig} options={chartOptions} />
                          )}
                          {chartConfig.type === 'pie' && (
                            <Pie data={chartConfig} options={chartOptions} />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(response.results[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {response.results.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-gray-50">
                            {Object.values(row).map((value: any, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                              >
                                {typeof value === 'number'
                                  ? value.toLocaleString()
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {responses.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No queries yet
            </h3>
            <p className="text-gray-600">
              Start by asking a question about your data above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
