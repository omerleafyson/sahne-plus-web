# Sahne Plus — Premium Web

Sahne Plus, AURA Technology için yarışmacı başvurusu, moderasyon, halk oylaması ve yetenek keşfini bir araya getiren yarışma odaklı web platformudur.

Bu depo Sahne Plus web sitesi içindir; Ömer Yapraklıoğlu kişisel sitesi ve AURA Snap projelerinden ayrıdır.

## Geçici yayın: Çok Yakında

Tam yarışma platformunun `apps/web` ve `services/api` entegrasyonları hazırlanana kadar Cloudflare Workers üzerinde geçici, statik “Çok Yakında” sayfası yayınlanır. Bu geçici site gerçek yarışma, moderasyon, oylama veya Firebase özelliklerini içermez.

Cloudflare Workers Builds ayarları:
- Repository: `omerleafyson/sahne-plus-web`
- Production branch: `main`
- Root directory: `/`
- Build command: `npm ci && npm run build -w @sahneplus/web`
- Deploy command: `npx wrangler deploy`
- Output: `apps/web/dist` (Wrangler assets)

Gerçek Firebase/Express API daha sonra, doğrulama yapılarak ayrıca bağlanacaktır.
