import { test, expect } from '@playwright/test';

test.describe('Veresiye Yeni Fonksiyon Testleri', () => {

  test('Küsüratlı giriş ve işlem düzenleme akışı', async ({ page }) => {
    await page.goto('http://localhost:9323'); 

    // 1. Veresiye sekmesine geç
    await page.getByText('VERESİYE', { exact: false }).click();

    // 2. Bir müşterinin detayına gir (Varsa 'deneme' isimli müşteriye tıkla)
    const müşteriKarti = page.locator('text=deneme').first();
    await müşteriKarti.click();

    // 3. KÜSÜRAT TESTİ: Virgül kullanarak tutar gir
    const tutarInput = page.getByPlaceholder('0,00');
    await tutarInput.fill('12,50'); // Virgül ile giriş yapıyoruz
    await page.getByPlaceholder('İşlem notu...').fill('Küsürat Testi');
    
    await page.getByRole('button', { name: 'İşlemi Onayla' }).click();
    await expect(page.locator('text=İşlem kaydedildi')).toBeVisible();

    // 4. DÜZENLEME TESTİ: Az önce eklediğimiz kaydı bul ve kalem ikonuna bas
    // Son eklenen işlem en üstte olmalı
    const düzenleButonu = page.locator('button:has(svg)').filter({ has: page.locator('path') }).last(); 
    await düzenleButonu.click();

    // Formun üzerinde "Kayıt Düzenleniyor" yazdığını doğrula
    await expect(page.locator('text=Kayıt Düzenleniyor')).toBeVisible();

    // Tutarı değiştir (12,50 -> 15,00)
    await tutarInput.fill('15,00');
    await page.getByRole('button', { name: 'Değişikliği Kaydet' }).click();

    // 5. SONUÇ KONTROLÜ
    await expect(page.locator('text=İşlem güncellendi')).toBeVisible();
    await expect(page.locator('text=15 ₺')).toBeVisible(); // Formatlı hali 15 ₺ olabilir
  });

});