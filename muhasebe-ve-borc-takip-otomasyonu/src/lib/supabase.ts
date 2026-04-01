import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("KRİTİK HATA: Supabase URL veya Key bulunamadı!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const mapSaleToDB = (sale: any) => {
  const { paymentMethod, productName, ...rest } = sale;
  return {
    ...rest,
    payment_method: paymentMethod || sale.payment_method,
    product_name: productName || sale.product_name
  };
};

export const api = {
  getSalesByDate: async (date: string) => {
    // RLS (deleted_at IS NULL) kuralı sayesinde silinenler zaten gelmeyecek
    const { data, error } = await supabase.from('sales').select('*').eq('date', date).order('created_at', { ascending: false });
    return error ? [] : data || [];
  },
  createSale: async (sale: any) => {
    const formattedSale = mapSaleToDB(sale);
    const { data, error } = await supabase.from('sales').insert([formattedSale]).select().single();
    if (error) throw error;
    return data;
  },
  updateSale: async (id: number, sale: any) => {
    const formattedSale = mapSaleToDB(sale);
    const { data, error } = await supabase.from('sales').update(formattedSale).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  // --- HAYALET SİLME GÜNCELLEMESİ ---
  deleteSale: async (id: number) => {
    const { error } = await supabase
      .from('sales')
      .update({ deleted_at: new Date().toISOString() }) // Tamamen silmek yerine tarih damgası vuruyoruz
      .eq('id', id);
    if (error) throw error;
  },
  getReport: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase.from('sales').select('*').gte('date', startDate).lte('date', endDate);
    if (error) throw error;
    return data || [];
  },
  getVeresiyeData: async () => {
    const { data, error } = await supabase.from('veresiye_persons').select('*, veresiye_transactions(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addVeresiyePerson: async (name: string, type: string, phone: string) => {
    const { data, error } = await supabase.from('veresiye_persons').insert([{ name, type, phone }]).select().single();
    if (error) throw error;
    return data;
  },
  updateVeresiyePerson: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('veresiye_persons').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  // --- HAYALET SİLME GÜNCELLEMESİ ---
  deleteVeresiyePerson: async (id: string) => {
    const { error } = await supabase
      .from('veresiye_persons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
  addVeresiyeTransaction: async (personId: string, amount: number, type: string, note: string) => {
    const { error } = await supabase.from('veresiye_transactions').insert([{ person_id: personId, amount, type, note }]);
    if (error) throw error;
  },
  updateVeresiyeTransaction: async (id: string, updates: any) => {
    const { error } = await supabase.from('veresiye_transactions').update(updates).eq('id', id);
    if (error) throw error;
  },
  // --- HAYALET SİLME GÜNCELLEMESİ ---
  deleteVeresiyeTransaction: async (id: string) => {
    const { error } = await supabase
      .from('veresiye_transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
  toggleVeresiyePersonStar: async (id: string, currentStatus: boolean) => {
    const { data, error } = await supabase
      .from('veresiye_persons')
      .update({ is_starred: !currentStatus })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};