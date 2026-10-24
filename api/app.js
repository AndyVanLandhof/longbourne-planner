import { putAny, readText, storageReady, list, del } from './_store.js';

let cache = { html: null, at: 0 };
const page = (t, m) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><body style="font:15px system-ui;padding:40px;max-width:520px;margin:auto;color:#17212B"><h1 style="font-size:20px">${t}</h1><p>${m}</p></body>`;

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Not allowed' });
    const chunks = []; for await (const c of req) chunks.push(c);
    const html = Buffer.concat(chunks).toString('utf8');
    if (!html.startsWith('<!doctype html>')) return res.status(400).json({ error: 'Expected an HTML document' });
    await putAny(`app/${Date.now()}.html`, html, { addRandomSuffix: true, contentType: 'text/html; charset=utf-8' });
    const all = (await list({ prefix: 'app/' })).blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
    if (all.length > 5) await del(all.slice(5).map(b => b.url));
    cache = { html, at: Date.now() };
    return res.status(200).json({ ok: true, bytes: html.length });
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (!storageReady()) return res.status(503).send(page('Almost ready', 'The planner is deployed but its storage is not connected yet.'));
  if (cache.html && Date.now() - cache.at < 30000) return res.status(200).send(cache.html);
  try {
    const all = (await list({ prefix: 'app/' })).blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
    if (!all.length) return res.status(503).send(page('Almost ready', 'Storage is connected. The planner page is being installed.'));
    const html = await readText(all[0].url);
    cache = { html, at: Date.now() };
    return res.status(200).send(html);
  } catch (e) {
    console.error(e);
    return res.status(500).send(page('Something went wrong', 'The planner could not be loaded. Try again in a minute.'));
  }
}
export const config = { api: { bodyParser: false } };
