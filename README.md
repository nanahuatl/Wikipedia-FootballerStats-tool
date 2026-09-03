# FootballerStats

Bu proje, Türkçe Vikipedi'de futbolcu maddelerini değiştirirken, kariyer istatistik girişini hızlandırmak için hazırlanmış bir kullanıcı betiğidir.

Araç şunları yapar:

- Değişiklik ekranına `FootballerStats` düğmesi ekler.
- Açılan pencerede şu alanları satır bazında toplar:
  - takım
  - sezon
  - lig maçı
  - lig golü
  - yerel lig maçı
  - yerel lig golü
  - ulusal kupa maçı
  - ulusal kupa golü
  - lig kupası maçı
  - lig kupası golü
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
3. [`trwiki-football-stats.user.js`](C:\Users\ozkan\wikipedia-football-stats-tool\trwiki-football-stats.user.js) içeriğini yapıştırın.
4. Betiği kaydedin.
5. Türkçe Vikipedi'de kaynak düzenleme ekranını açın.

## Kullanım
1. Futbolcu maddesini açın.
2. Üst kısımda gelen `FootballerStats` düğmesine tıklayın.
3. Maddede kullanılan bir bilgi kutusu varsa, bilgi kutusundaki bazı veriler aracın arayüzüne otomatik olarak geleccektir.
4. Futbolcunun her bir sezonda, farklı müsabakalardaki istatistiklerini girin.
5. `Önizle` ile üretilecek metni görün.
6. Normal Vikipedi kayıt akışı ile değişikliği kaydedin.

## Varsayımlar
Bu ilk sürüm şu varsayımlarla çalışır:

- Kaynak düzenleyicide ana metin kutusu `wpTextbox1` kimliğini kullanır.
- Arayüz teması olarak `Monobook`, `Vector` veya `Vector 2022` kullanılır.
- Bilgi kutusu şablonu `{{Futbolcu bilgi kutusu ...}}` satırıyla başlar.
- Bilgi kutusu kariyer alanları `kulüpyıl1`, `kulüp1`, `maç1`, `gol1` biçimindedir.
- Kariyer istatistik başlığı `== Kariyer istatistikleri ==` olarak yazılır.

## Notlar
- Betik sadece vikimetni düzenler, değişiklikleri sizin kaydetmeniz gerekir.
- Farklı bir bilgi kutusu şablonu veya farklı parametre adı kullanıyorsanız betikteki düzenli ifadeler genişletilebilir.
- Mevcut kariyer tablosu daha özel bir biçimdeyse bu sürüm onu yeniden kurar, elle eklenmiş özel biçimlendirmeleri korumaz.

## Lisans
Bu proje [Creative Commons Attribution-ShareAlike 3.0 Unported](LICENSE) lisansı altında yayımlanmaktadır.
