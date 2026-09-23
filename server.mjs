import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png' };

async function masks() {
  return (await readdir(join(root, 'masks')))
    .map(file => /^dv_(.+)\.png$/i.exec(file)?.[1]).filter(Boolean)
    .sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/api/dv-masks') {
    response.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
    return response.end(JSON.stringify(await masks()));
  }
  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^[/\\]+/, '');
  const filename = resolve(root, normalize(relative));
  if (!filename.startsWith(root)) { response.writeHead(403); return response.end('Forbidden'); }
  try {
    const content = await readFile(filename);
    response.writeHead(200, { 'Content-Type':mime[extname(filename)] ?? 'application/octet-stream', 'Cache-Control':'no-store' });
    response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(8000, () => console.log('Shield editor: http://localhost:8000'));
