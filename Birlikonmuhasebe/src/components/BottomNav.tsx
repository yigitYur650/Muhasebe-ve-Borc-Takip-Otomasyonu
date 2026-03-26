import { ShoppingBag, BarChart3, BookOpen } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'sales' | 'reports' | 'veresiye';
  onTabChange: (tab: 'sales' | 'reports' | 'veresiye') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 z-40 safe-bottom">
      <div className="grid grid-cols-3 max-w-lg mx-auto relative">
        <button
          onClick={() => onTabChange('sales')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-all ${activeTab === 'sales' ? 'text-amber-500' : 'text-slate-400'}`}
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Satışlar</span>
          {activeTab === 'sales' && (
            <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-b-full" />
          )}
        </button>

        <button
          onClick={() => onTabChange('veresiye')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-all ${activeTab === 'veresiye' ? 'text-amber-500' : 'text-slate-400'}`}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Veresiye</span>
          {activeTab === 'veresiye' && (
            <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-b-full" />
          )}
        </button>

        <button
          onClick={() => onTabChange('reports')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-all ${activeTab === 'reports' ? 'text-amber-500' : 'text-slate-400'}`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Raporlar</span>
          {activeTab === 'reports' && (
            <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-b-full" />
          )}
        </button>
      </div>
    </nav>
  );
}