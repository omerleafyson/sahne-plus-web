import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const directory = dirname(fileURLToPath(import.meta.url));
await mkdir(join(directory, 'dist'), { recursive: true });
await copyFile(join(directory, 'index.html'), join(directory, 'dist', 'index.html'));
console.log('Sahne Plus static page built: apps/web/dist/index.html');
