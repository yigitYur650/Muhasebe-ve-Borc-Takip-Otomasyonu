import { useState, useEffect, useCallback } from 'react';
import { Plus, LogOut, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

import DateScroller from './components/DateScroller';
import DashboardSummary from './components/DashboardSummary';
import TransactionList from './components/TransactionList';
import { AddSaleModal } from './components/AddSaleModal';
import ReportsPage from './components/ReportsPage';
import BottomNav from './components/BottomNav';
import LoginPage from './components/LoginPage';
import VeresiyePage from './components/VeresiyePage';
import { api, supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'reports' | 'veresiye'>('sales');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sales, setSales] = useState<any[]>([]);
  const [veresiyeData, setVeresiyeData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      if (activeTab === 'sales') {
        const data = await api.getSalesByDate(format(selectedDate, 'yyyy-MM-dd'));
        setSales(data);
      } else if (activeTab === 'veresiye') {
        const data = await api.getVeresiyeData();
        setVeresiyeData(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Veri yüklenemedi.');
    }
    setIsLoading(false);
  }, [selectedDate, session, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSale = async (saleData: any) => {
    // ESLint Hatası Çözümü: async promise executor yerine fonksiyon tanımladık
    const saveAction = async () => {
      if (editingSale) {
        return await api.updateSale(editingSale.id, saleData);
      } else {
        return await api.createSale(saleData);
      }
    };

    await toast.promise(saveAction(), {
      loading: 'Kaydediliyor...',
      success: editingSale ? 'Satış güncellendi! 🔄' : 'Satış eklendi! 💰',
      error: (err) => `Hata: ${err.message}`, // Kullanılmayan error hatası çözümü
    });

    setIsModalOpen(false);
    setEditingSale(null);
    fetchData();
  };

  const handleDeleteSale = async (id: number) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteSale(id);
      toast.success('Silindi');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Hata oluştu');
    }
  };

  if (loadingSession) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div></div>;
  if (!session) return <><Toaster position="top-center" /><LoginPage /></>;

  const cashTotal = sales.filter(s => s.payment_method === 'Nakit').reduce((sum, s) => sum + Number(s.amount), 0);
  const mailOrderTotal = sales.filter(s => s.payment_method === 'Mail Order').reduce((sum, s) => sum + Number(s.amount), 0);
  const cardTotal = sales.filter(s => s.payment_method !== 'Nakit' && s.payment_method !== 'Mail Order').reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="min-h-screen bg-black pb-20 relative">
      <Toaster position="top-center" toastOptions={{ style: { background: '#0f172a', color: '#fff' } }} />
      
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl"><LayoutDashboard size={20} className="text-black" /></div>
          <div>
            <h1 className="font-bold text-white text-sm">Ciro Takip</h1>
            <span className="text-xs text-slate-400">{session.user.email}</span>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-red-500"><LogOut size={20} /></button>
      </header>

      {activeTab === 'sales' && (
        <>
          <DateScroller selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <DashboardSummary cashTotal={cashTotal} cardTotal={cardTotal} mailOrderTotal={mailOrderTotal} />
          {isLoading ? <div className="py-20 text-center text-slate-500">Yükleniyor...</div> : 
          <TransactionList sales={sales} onDelete={handleDeleteSale} onEdit={(s) => {setEditingSale(s); setIsModalOpen(true);}} />}
          <button onClick={() => {setEditingSale(null); setIsModalOpen(true);}} className="fixed bottom-24 right-6 w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"><Plus size={32} /></button>
        </>
      )}

      {activeTab === 'veresiye' && <VeresiyePage data={veresiyeData} onRefresh={fetchData} />}
      
      {/* TS2322 Hatası Çözümü: Senin ReportsPage'in prop almıyor, o yüzden prop göndermiyoruz */}
      {activeTab === 'reports' && <ReportsPage />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AddSaleModal isOpen={isModalOpen} onClose={() => {setIsModalOpen(false); setEditingSale(null);}} onSave={handleSaveSale} defaultDate={format(selectedDate, 'yyyy-MM-dd')} saleToEdit={editingSale} />
    </div>
  );
}

export default App;