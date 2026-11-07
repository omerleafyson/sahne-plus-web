# Sahne Plus — Premium Web

Sahne Plus, AURA Technology için yarışmacı başvurusu, moderasyon, halk oylaması ve yetenek keşfini bir araya getiren yarışma odaklı web platformudur.

Bu depo Sahne Plus web sitesi içindir; Ömer Yapraklıoğlu kişisel sitesi ve AURA Snap projelerinden ayrıdır.

## Kurulum durumu

Proje deposu ilk commit ile oluşturuldu. Premium web sitesi kaynak kodlarının (`apps/web`, `services/api`, `package.json`, `package-lock.json`, `wrangler.jsonc`) ayrıca yüklenmesi gereklidir. Kod yüklenene kadar Cloudflare build/deploy denenmemelidir.

Cloudflare Workers Builds için Vite web derlemesi ve Wrangler static assets yapılandırması gereklidir. Gerçek Firebase/Express API ayrı entegrasyondur.
