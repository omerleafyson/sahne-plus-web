import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const directory = dirname(fileURLToPath(import.meta.url));
const output = join(directory, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'favicon.svg', 'background.avif']) await copyFile(join(directory, file), join(output, file));
console.log('Sahne Plus coming-soon site built: index.html + original S+ favicon.svg');
