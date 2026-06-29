import React from 'react';
import { Droplet, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  onBack: () => void;
}

export default function Header({ role, onBack }: HeaderProps) {
  const getSubTitle = () => {
    switch (role) {
      case 'owner':
        return 'Aapke saare customers ek jagah';
      case 'boy':
        return 'Aaj ke customers ke delivery timings';
      case 'kharche':
        return 'Business ke kharcho aur kamai ka hisaab';
      default:
        return 'Jar Business Manager';
    }
  };

  const getTitle = () => {
    switch (role) {
      case 'boy':
        return '🚚 Delivery List';
      case 'kharche':
        return '💸 Kharche & Profit';
      default:
        return '💧 Jar Business';
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-sky-500 text-white px-5 py-4 sticky top-0 z-50 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        {role !== 'boy' && role !== 'kharche' && (
          <Droplet className="w-6 h-6 text-sky-100 animate-pulse fill-sky-200" />
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            {getTitle()}
          </h1>
          <p className="text-xs text-sky-100 opacity-90 mt-0.5">{getSubTitle()}</p>
        </div>
      </div>

      {role && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm"
          id="btn-back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Mukhya Menu</span>
        </button>
      )}
    </header>
  );
}
