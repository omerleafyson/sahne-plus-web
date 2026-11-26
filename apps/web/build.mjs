import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const directory = dirname(fileURLToPath(import.meta.url));
const output = join(directory, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'favicon.svg', 'background.avif', 'gizlilik-politikasi.html', 'hesap-silme.html', 'support.html', 'child-safety.html', 'kesfet.html', 'yarismalar.html', 'canli-yayin.html', 'topluluk.html', 'ozellikler.html', 'performans-paylas.html', 'siralamalar.html', 'uygulama.html', 'feature-pages.css', 'feature-pages.js']) await copyFile(join(directory, file), join(output, file));
console.log('Sahne Plus site built: homepage, feature pages and legal routes');
