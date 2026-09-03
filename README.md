# Türkçe Vikipedi Futbolcu İstatistik Aracı

Bu proje, Türkçe Vikipedi'de futbolcu maddelerini kaynak düzenleyicide düzenlerken sezonluk istatistik girişini hızlandırmak için hazırlanmış bir kullanıcı betiğidir.

Güncel sürümde Transfermarkt detaylı istatistik sayfasından veriyi forma çekmeye yönelik bir deneme içe aktarma özelliği de vardır. Bu özellik veriyi doğrudan kaydetmez; önce forma doldurur, kullanıcı kontrol eder.

Araç şunları yapar:

- Düzenleme ekranına `Futbolcu istatistik araci` düğmesi ekler.
- Açılan pencerede şu alanları satır bazında toplar:
  - takım
  - sezon
  - lig maçı
  - lig golü
  - kupa maçı
  - kupa golü
  - kıtasal müsabaka maçı
  - kıtasal müsabaka golü
  - diğer maç
  - diğer gol
- Lig maç ve lig gol verilerini bilgi kutusundaki `maçN` ve `golN` parametrelerine yazar.
- Takım ve sezon verilerini bilgi kutusundaki `kulüpN` ve `kulüpyılN` parametrelerine yazar.
- `== Kariyer istatistikleri ==` bölümünü oluşturur veya var olan bölümü yeniler.
- Her satır için toplam maç ve toplam gol sütunlarını hesaplar.
- Tablo sonunda genel toplam maç ve genel toplam gol satırı ekler.

## Kurulum

1. Tarayıcıya Tampermonkey veya Violentmonkey kurun.
2. Yeni bir kullanıcı betiği oluşturun.
3. [`trwiki-football-stats.user.js`] içeriğini yapıştırın.
4. Betiği kaydedin.
5. Türkçe Vikipedi'de kaynak düzenleme ekranını açın.

## Kullanım

1. Maddeyi `Kaynağı değiştir` ile açın.
2. Üst kısımda gelen `Futbolcu istatistik araci` düğmesine tıklayın.
3. Her sezon için bir satır doldurun.
4. `Onizleme olustur` ile üretilecek vikimetni görün.
5. `Metne uygula` düğmesi ile içerik düzenleme kutusuna yazdırın.
6. Normal Vikipedi kayıt akışı ile değişikliği kaydedin.

## Varsayımlar

Bu ilk sürüm şu varsayımlarla çalışır:

- Kaynak düzenleyicide ana metin kutusu `wpTextbox1` kimliğini kullanır.
- Arayüz teması olarak `Monobook`, `Vector` veya `Vector 2022` kullanılır.
- Bilgi kutusu şablonu `{{Futbolcu bilgi kutusu ...}}` satırıyla başlar.
- Bilgi kutusu kariyer alanları `kulüpyıl1`, `kulüp1`, `maç1`, `gol1` biçimindedir.
- Kariyer istatistik başlığı `== Kariyer istatistikleri ==` olarak yazılır.

## Notlar

- Betik sadece vikimetni düzenler; yayımlama işlemini sizin yapmanız gerekir.
- Farklı bir bilgi kutusu şablonu veya farklı parametre adı kullanıyorsanız betikteki düzenli ifadeler genişletilebilir.
- Mevcut kariyer tablosu daha özel bir biçimdeyse bu sürüm onu yeniden kurar; elle eklenmiş özel biçimlendirmeleri korumaz.

 ## Lisans

- Bu proje [Creative Commons Attribution-ShareAlike 3.0 Unported](LICENSE) lisansı altında yayımlanmaktadır.
