# Sahne Plus — Premium Web

Sahne Plus, AURA Technology için yarışmacı başvurusu, moderasyon, halk oylaması ve yetenek keşfini bir araya getiren yarışma odaklı web platformudur.

Bu depo yalnızca Sahne Plus web sitesi içindir; AURA Snap ve diğer projelerden ayrıdır.

## Geçici yayın: Çok Yakında

Tam uygulama geliştirilene kadar `https://sahneplus.tr/` adresinde mobil, tablet ve masaüstü uyumlu **Disney+ esintili Sahne Plus “Çok Yakında” ekranı** yayınlanır. Markanın S+ logosu hem ana sayfada hem tarayıcı ikonunda kullanılır.

Geçici site yarışma, moderasyon, oylama veya Firebase API işlevlerini henüz içermez.

### Cloudflare Workers Builds

- Repository: `omerleafyson/sahne-plus-web`
- Production branch: `main`
- Root directory: `/`
- Build command: `npm ci && npm run build -w @sahneplus/web`
- Deploy command: `npx wrangler deploy`
- Static assets: `apps/web/dist`
- Wrangler configuration: `wrangler.toml`

`apps/web/build.mjs`, `index.html` ile `favicon.svg` dosyalarını statik assets klasörüne kopyalar.

**Önemli:** GitHub'da güncel commit bulunması, Cloudflare'ın o commit'i canlıya dağıttığını kanıtlamaz. Dağıtımda son `main` commit'i, üretim sürümünün hash'i ve canlı sayfadaki `Çok Yakında` başlığı + `/favicon.svg` HTTP 200 sonucu ayrıca doğrulanmalıdır.

Gerçek Firebase/Express API daha sonra ayrı entegrasyondur.

## Güncel görünüm

Kurucu tarafından sağlanan siyah zeminli pembe-mavi metalik halka görseli `apps/web/background.avif` dosyası olarak optimize edilmiştir. `apps/web/index.html` arka planı doğrudan bu görselden okur. `apps/web/build.mjs` bu dosyayı Cloudflare Workers statik varlıklarına kopyalar. Sahne Plus S+ logosu ve mobil yerleşim korunur.
