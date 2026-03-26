import { test, expect } from '@playwright/test';

test.describe('Veresiye Müşteri Yıldızlama Sistemi', () => {
  
  test('yıldızlı müşteriler listenin en üstünde gösterilmelidir', async ({ page }) => {
    // 1. Supabase API yanıtını mock'luyoruz (Gerçek veritabanını bozmamak için)
    await page.route('**/rest/v1/veresiye_persons*', async (route) => {
      const json = [
        {
          id: '1',
          name: 'Normal Müşteri (Ahmet)',
          type: 'kisi',
          phone: '5551112233',
          is_starred: false,
          created_at: '2026-03-27T10:00:00.000Z',
          veresiye_transactions: [{ amount: 100, type: 'alacak_ekle' }]
        },
        {
          id: '2',
          name: 'VIP Müşteri (Mehmet)',
          type: 'kisi',
          phone: '5559998877',
          is_starred: true, // Bu yıldızlı!
          created_at: '2026-03-27T10:05:00.000Z',
          veresiye_transactions: [{ amount: 500, type: 'alacak_ekle' }]
        }
      ];
      await route.fulfill({ json });
    });

    // 2. Sayfaya git
    await page.goto('http://localhost:5173/');    
    await page.getByPlaceholder('admin@sirket.com').fill('birlik1952@gmail.com');
    await page.getByPlaceholder('••••••••').fill('birlik1952'); 
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    // Eğer login ekranı varsa ve geçmek gerekiyorsa buraya login adımlarını eklersin
    // Alt navigasyondan Veresiye sekmesine tıkla
    await page.getByText('Veresiye').click();

    // 3. Verilerin yüklenmesini bekle (İsimlerin ekranda görünmesini kontrol ediyoruz)
    await expect(page.getByText('Normal Müşteri (Ahmet)')).toBeVisible();
    await expect(page.getByText('VIP Müşteri (Mehmet)')).toBeVisible();

    // 4. Sıralamayı kontrol et: Listenin ilk elemanı Yıldızlı olan mı?
    // Ekrana basılan kişi kartlarının başlıklarını bir diziye alıyoruz
    const personNames = await page.locator('h3.text-white.font-bold').allInnerTexts();
    
    // Test: Listenin ilk sırasındaki kişi 'VIP Müşteri (Mehmet)' olmalı
    expect(personNames[0]).toBe('VIP Müşteri (Mehmet)');
    // Test: İkinci sıradaki kişi 'Normal Müşteri (Ahmet)' olmalı
    expect(personNames[1]).toBe('Normal Müşteri (Ahmet)');
  });

});