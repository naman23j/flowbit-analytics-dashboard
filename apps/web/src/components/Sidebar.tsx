'use client';

import { Home, FileText, FolderOpen, Layers, Users, Settings, MessageSquare, ChevronsUpDown } from 'lucide-react';

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

export default function Sidebar({ activeItem = 'Dashboard', onItemClick }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: 'Dashboard' },
    { icon: MessageSquare, label: 'Chat with Data' },
    { icon: FileText, label: 'Invoice' },
    { icon: FolderOpen, label: 'Other files' },
    { icon: Layers, label: 'Departments' },
    { icon: Users, label: 'Users' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div 
      className="flex flex-col bg-white"
      style={{
        width: '240px',
        minWidth: '240px',
        maxWidth: '240px',
        height: '100vh',
        borderRight: '1px solid rgba(228, 228, 231, 1)',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/newicon.png" 
              alt="Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                background: 'rgba(0, 80, 170, 1)',
                border: '1px solid rgba(228, 228, 231, 1)',
                padding: '0.5rem',
              }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Buchhaltung</p>
              <p className="text-xs text-gray-500">12 members</p>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <nav className="p-2 flex-1">
        <div className="px-3 pb-2 text-xs font-semibold text-gray-500 tracking-wide">
          GENERAL
        </div>
        
        <div className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;
            
            return (
              <button
                key={item.label}
                onClick={() => onItemClick?.(item.label)}
                style={{
                  backgroundColor: isActive ? 'rgba(227, 230, 240, 1)' : 'transparent',
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50"
              >
                <Icon 
                  style={{
                    width: '20px',
                    height: '20px',
                    color: isActive ? 'rgba(27, 20, 100, 1)' : '#71717A',
                  }}
                />
                <span 
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isActive ? 'rgba(27, 20, 100, 1)' : '#3F3F46',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-6 py-6 border-t border-gray-200">
        <div className="flex items-center relative">
          <img 
            src="/flowbit-logo.png" 
            alt="Flowbit"
            style={{ width: '19px', height: '20px' }}
          />
          <div
            style={{
              position: 'absolute',
              top: '1.32px',
              left: '25.48px',
              background: 'linear-gradient(0deg, #1C1C1C, #1C1C1C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Flowbit
          </div>
        </div>
      </div>
    </div>
  );
}
