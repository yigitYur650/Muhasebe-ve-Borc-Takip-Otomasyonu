import { useState, useEffect } from 'react';
import { UserPlus, Search, Building2, User, Trash2, Edit, Plus, Minus, Phone, History, Calendar, X, Star } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { api } from '../lib/supabase';

interface VeresiyePageProps {
  data: any[];
  onRefresh: () => void;
}

export default function VeresiyePage({ data, onRefresh }: VeresiyePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', type: 'kisi', phone: '' });
  const [transData, setTransData] = useState({ amount: '', note: '', type: 'alacak_ekle' });

  const selectedPersonId = selectedPerson?.id;
  
  useEffect(() => {
    if (selectedPersonId) {
      const updated = data.find(p => p.id === selectedPersonId);
      if (updated) setSelectedPerson(updated);
    }
  }, [data, selectedPersonId]);

  const totalAlacak = data.filter(p => Number(p.balance) > 0).reduce((sum, p) => sum + Number(p.balance), 0);
  const totalBorc = data.filter(p => Number(p.balance) < 0).reduce((sum, p) => sum + Math.abs(Number(p.balance)), 0);

  const handleAddPerson = async () => {
    if (!formData.name) return;
    try {
      await api.addVeresiyePerson(formData.name, formData.type, formData.phone);
      toast.success('Yeni kayıt oluşturuldu');
      setIsAddModalOpen(false);
      setFormData({ name: '', type: 'kisi', phone: '' });
      onRefresh();
    } catch { toast.error('Hata oluştu'); }
  };

  const handleUpdatePerson = async () => {
    if (!selectedPerson || !formData.name) return;
    try {
      await api.updateVeresiyePerson(selectedPerson.id, formData);
      toast.success('Bilgiler güncellendi');
      setIsEditModalOpen(false);
      onRefresh();
    } catch { toast.error('Güncellenemedi'); }
  };

  const handleTransaction = async () => {
    if (!selectedPerson || !transData.amount) return;

    try {
      const cleanAmount = transData.amount.toString().replace(/\./g, '').replace(',', '.');
      const numericAmount = parseFloat(cleanAmount);

      if (isNaN(numericAmount)) {
        toast.error('Geçerli bir tutar giriniz');
        return;
      }

      if (editingTransaction) {
        await api.updateVeresiyeTransaction(editingTransaction.id, {
          amount: numericAmount,
          type: transData.type,
          note: transData.note || 'İşlem Kaydı'
        });
        toast.success('İşlem güncellendi');
        setEditingTransaction(null);
      } else {
        await api.addVeresiyeTransaction(selectedPerson.id, numericAmount, transData.type, transData.note || 'İşlem Kaydı');
        toast.success('İşlem kaydedildi');
      }
      
      setTransData({ amount: '', note: '', type: 'alacak_ekle' });
      onRefresh(); 
    } catch { toast.error('İşlem başarısız'); }
  };

  // Yıldızlıları en üste alacak şekilde sıralama ve arama filtresi
  const sortedData = [...data].sort((a, b) => {
    if (a.is_starred === b.is_starred) return 0;
    return a.is_starred ? -1 : 1;
  });
  
  const filtered = sortedData.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 pb-32 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl shadow-lg">
          <p className="text-[10px] uppercase font-bold text-emerald-500/60 mb-1 tracking-widest">Alacaklarımız</p>
          <p className="text-xl font-black text-emerald-500">{totalAlacak.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl shadow-lg">
          <p className="text-[10px] uppercase font-bold text-red-500/60 mb-1 tracking-widest">Borçlarımız</p>
          <p className="text-xl font-black text-red-500">{totalBorc.toLocaleString('tr-TR')} ₺</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Kişi/Firma ara..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:border-amber-500 outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => { setFormData({name:'', type:'kisi', phone:''}); setIsAddModalOpen(true); }} className="bg-amber-500 text-black px-4 rounded-2xl active:scale-95 transition-all">
          <UserPlus size={24} />
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map(person => (
          <div key={person.id} onClick={() => { setSelectedPerson(person); setIsDetailModalOpen(true); }} className="group bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:border-slate-600 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${person.balance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {person.type === 'firma' ? <Building2 size={24} /> : <User size={24} />}
              </div>
              <div>
                <h3 className="text-white font-bold leading-tight">{person.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mt-1"><Phone size={10}/> {person.phone || 'Tel Kaydı Yok'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`font-black text-lg ${person.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Math.abs(person.balance).toLocaleString('tr-TR')} ₺
                </p>
                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-tighter">{person.balance >= 0 ? 'Alacak' : 'Borç'}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    try {
                      await api.toggleVeresiyePersonStar(person.id, person.is_starred);
                      onRefresh();
                    } catch {
                      toast.error('İşlem başarısız');
                    }
                  }} 
                  className={`p-2 transition-colors ${person.is_starred ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
                >
                  <Star size={18} fill={person.is_starred ? "currentColor" : "none"} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setSelectedPerson(person); setFormData({name:person.name, type:person.type, phone:person.phone||''}); setIsEditModalOpen(true); }} className="p-2 text-slate-500 hover:text-amber-500 transition-colors"><Edit size={18} /></button>
                <button onClick={(e) => { e.stopPropagation(); if(confirm(`${person.name} silinsin mi?`)) api.deleteVeresiyePerson(person.id).then(onRefresh); }} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isDetailModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-slate-900 w-full max-w-lg h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col rounded-t-[32px] sm:rounded-[32px] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-10">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPerson.balance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {selectedPerson.type === 'firma' ? <Building2 size={24} /> : <User size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white leading-none mb-1 flex items-center gap-2">
                    {selectedPerson.name}
                    {selectedPerson.is_starred && <Star size={16} className="text-amber-400" fill="currentColor" />}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10}/> {selectedPerson.phone || 'Numara yok'}</p>
                </div>
              </div>
              <button onClick={() => { setIsDetailModalOpen(false); setEditingTransaction(null); }} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="bg-slate-800/20 border border-slate-800 p-5 rounded-3xl space-y-5">
                {editingTransaction && (
                  <div className="flex justify-between items-center bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <span className="text-amber-500 text-xs font-bold uppercase">Kayıt Düzenleniyor</span>
                    <button onClick={() => { setEditingTransaction(null); setTransData({amount:'', note:'', type:'alacak_ekle'}); }} className="text-amber-500"><X size={16}/></button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setTransData({...transData, type: 'alacak_ekle'})} className={`flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${transData.type === 'alacak_ekle' ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-800 text-slate-500'}`}><Plus size={18}/> Alacak</button>
                  <button onClick={() => setTransData({...transData, type: 'borc_odeme'})} className={`flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${transData.type === 'borc_odeme' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}><Minus size={18}/> Borç</button>
                </div>
                
                <div className="flex justify-end gap-2 mb-1 mt-2">
                  <button 
                    onClick={() => {
                      let val = transData.amount.toString();
                      if (!val) val = "0";
                      if (val.includes(',')) {
                        if (val.split(',')[1].length === 1) setTransData({...transData, amount: val + '0'});
                      } else if (!val.includes('.')) {
                        setTransData({...transData, amount: val + ',00'});
                      }
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 transition-all flex items-center gap-1"
                  >
                    +,00 Ekle
                  </button>
                  <button 
                    onClick={() => {
                      let val = transData.amount.toString();
                      if (!val) val = "0";
                      if (!val.includes(',')) {
                        setTransData({...transData, amount: val + ',50'});
                      }
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-500 transition-all flex items-center gap-1"
                  >
                    +,50 Ekle
                  </button>
                  <button 
                    onClick={() => {
                      const val = transData.amount.toString();
                      if (val.includes(',')) setTransData({...transData, amount: val.split(',')[0]});
                      else if (val.includes('.')) setTransData({...transData, amount: val.split('.')[0]});
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all flex items-center gap-1"
                  >
                    Kuruşu Sil
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">₺</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0,00" 
                    className="w-full bg-slate-900 border-none rounded-2xl py-5 pl-10 pr-4 text-3xl font-black text-white outline-none" 
                    value={transData.amount} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setTransData({...transData, amount: val});
                    }} 
                  />
                </div>
                <input type="text" placeholder="İşlem notu..." className="w-full bg-slate-900 p-4 rounded-xl text-sm text-white outline-none ring-1 ring-slate-800" value={transData.note} onChange={e => setTransData({...transData, note: e.target.value})} />
                <button onClick={handleTransaction} className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${transData.type === 'alacak_ekle' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                  {editingTransaction ? 'Değişikliği Kaydet' : 'İşlemi Onayla'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14}/> İşlem Geçmişi</h3>
                <div className="space-y-2">
                  {selectedPerson.veresiye_transactions?.length > 0 ? (
                    [...selectedPerson.veresiye_transactions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: any) => (
                      <div key={t.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${t.type === 'alacak_ekle' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {t.type === 'alacak_ekle' ? <Plus size={14}/> : <Minus size={14}/>}
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold leading-none mb-1">{t.note}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10}/> {format(new Date(t.date), 'dd MMMM yyyy, HH:mm', { locale: tr })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`font-black text-base ${t.type === 'alacak_ekle' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {t.type === 'alacak_ekle' ? '+' : '-'}{Number(t.amount).toLocaleString('tr-TR')} ₺
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(t);
                              setTransData({ amount: t.amount.toString(), note: t.note, type: t.type });
                            }}
                            className="p-1 text-slate-600 hover:text-amber-500"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if(confirm('Bu işlemi silmek istediğinize emin misiniz? Bakiye otomatik olarak güncellenecektir.')) {
                                try {
                                  await api.deleteVeresiyeTransaction(t.id);
                                  toast.success('İşlem silindi');
                                  if (editingTransaction?.id === t.id) {
                                    setEditingTransaction(null);
                                    setTransData({ amount: '', note: '', type: 'alacak_ekle' });
                                  }
                                  onRefresh();
                                } catch {
                                  toast.error('İşlem silinemedi');
                                }
                              }
                            }}
                            className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        </div>
                      
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-600 text-xs">Henüz işlem yok.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-6">{isEditModalOpen ? 'Bilgileri Düzenle' : 'Yeni Veresiye Kaydı'}</h2>
            <div className="space-y-4">
              <input type="text" placeholder="İsim / Ünvan" className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none ring-1 ring-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="Telefon" className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none ring-1 ring-slate-700" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <select className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none ring-1 ring-slate-700" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="kisi">Şahıs</option>
                <option value="firma">Firma / Tedarikçi</option>
              </select>
              <div className="flex gap-2 pt-4">
                <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-4 text-slate-400 font-bold">İptal</button>
                <button onClick={isEditModalOpen ? handleUpdatePerson : handleAddPerson} className="flex-1 py-4 bg-amber-500 text-black rounded-xl font-black active:scale-95 transition-all">
                  {isEditModalOpen ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}