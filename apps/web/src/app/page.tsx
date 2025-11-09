'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import ChatWithData from '@/components/ChatWithData';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

  const handleSidebarClick = (label: string) => {
    if (label === 'Dashboard') setActiveTab('dashboard');
    else if (label === 'Chat with Data') setActiveTab('chat');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeItem={activeTab === 'dashboard' ? 'Dashboard' : 'Chat with Data'} 
        onItemClick={handleSidebarClick}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header 
          className="bg-white border-b flex items-center justify-between px-6"
          style={{ height: '64px', borderBottom: '1px solid rgba(228, 228, 231, 1)' }}
        >
          <div className="flex items-center">
            <span className="text-base font-semibold text-gray-900">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <img 
              src="/admin.jpg" 
              alt="Profile"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Amit Jadhav</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
                <circle cx="2" cy="2" r="2" fill="currentColor"/>
                <circle cx="2" cy="8" r="2" fill="currentColor"/>
                <circle cx="2" cy="14" r="2" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50" style={{ padding: '24px 28px 16px 28px' }}>
          <div style={{ maxWidth: '1164px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeTab === 'dashboard' ? <Dashboard /> : <ChatWithData />}
          </div>
        </div>
      </div>
    </div>
  );
}
