import { test, expect } from '@playwright/test';

test.describe('Uygulama Stres ve Dayanıklılık Testi', () => {

  test.beforeEach(async ({ page }) => {
    // Canlı linkini veya localhost'u buraya yazabilirsin
    await page.goto('http://localhost:9323'); 
  });

  test('1. Boş Form ve Hatalı Giriş Engelleme', async ({ page }) => {
    // Hiçbir şey doldurmadan ekle butonuna bas
    const ekleButonu = page.getByRole('button', { name: /Satış Ekle/i });
    await ekleButonu.click();

    // Eğer kodunda validation (doğrulama) varsa, başarı mesajı çıkmamalı
    const basariMesaji = page.locator('text=başarıyla');
    await expect(basariMesaji).not.toBeVisible({ timeout: 2000 });
    
    // Fiyat alanına harf yazmayı dene (type="number" engellemesi kontrolü)
    const fiyatInput = page.locator('input[type="number"]').first();
    await fiyatInput.fill('abc');
    const inputValue = await fiyatInput.inputValue();
    expect(inputValue).toBe(''); // Harf girilememeli
  });

  test('2. Veresiye Arama Kutusu Performansı', async ({ page }) => {
    // Veresiye sayfasına geç
    await page.getByText('VERESİYE', { exact: false }).click();
    
    const aramaKutusu = page.getByPlaceholder('Kişi/Firma ara...');
    await aramaKutusu.fill('olmayan_bir_isi_123');

    // Liste boşalmış olmalı veya "Henüz işlem yok" yazmalı
    const listeElemanlari = page.locator('.group.bg-slate-900'); // Person card class'ın
    await expect(listeElemanlari).toHaveCount(0);
  });

  test('3. Silme İşlemi ve Onay Penceresi', async ({ page }) => {
    await page.getByText('VERESİYE', { exact: false }).click();

    // Silme butonuna bastığında çıkan browser confirm kutusunu otomatik kabul et
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('silinsin mi?');
      await dialog.accept();
    });

    // Eğer listede birisi varsa silme butonuna (Trash2 ikonu) tıkla
    const silButonu = page.locator('button:has(svg)').filter({ has: page.locator('path') }).last(); 
    // Not: Seçiciyi projedeki çöp kutusu ikonuna göre revize etmek gerekebilir
    
    if (await silButonu.isVisible()) {
      await silButonu.click();
    }
  });

  test('4. Mobil Duyarlılık (Tıklanabilirlik)', async ({ page }) => {
    // Ekranı telefon boyutuna getir (Mobil öncelikli uygulama testi)
    await page.setViewportSize({ width: 375, height: 812 });

    // Alt menü butonlarının hala tıklanabilir ve görünür olduğunu kontrol et
    const raporlarButonu = page.getByText('RAPORLAR', { exact: false });
    await expect(raporlarButonu).toBeVisible();
    await raporlarButonu.click();
  });

});