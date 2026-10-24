import { put, list, del, get } from '@vercel/blob';

// The store may be private or public; learn which on first use.
let ACCESS = process.env.BLOB_ACCESS || null;
const order = () => (ACCESS ? [ACCESS] : ['private', 'public']);
export const storageReady = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
export async function putAny(path, body, opts) {
  let err;
  for (const access of order()) {
    try { const r = await put(path, body, { ...opts, access }); ACCESS = access; return r; } catch (e) { err = e; }
  }
  throw err;
}
export async function readText(url) {
  let err;
  for (const access of order()) {
    try {
      const r = await get(url, { access, useCache: false });
      if (!r || !r.stream) throw new Error('not found');
      ACCESS = access;
      return await new Response(r.stream).text();
    } catch (e) { err = e; }
  }
  throw err;
}
export { list, del };

const KEEP = 20; // versions kept per design / item, newest first
const KINDS = new Set(['designs', 'catalog']);

export function checkAuth(req, res) {
  const pass = process.env.APP_PASSCODE;
  if (!pass) { res.status(500).json({ error: 'APP_PASSCODE is not set on the server' }); return false; }
  if ((req.headers['x-passcode'] || '') !== pass) { res.status(401).json({ error: 'Wrong passcode' }); return false; }
  if (!storageReady()) { res.status(503).json({ error: 'Storage is not connected yet. Connect a Blob store to this project in Vercel, then redeploy.' }); return false; }
  return true;
}
export const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);

async function listAll(prefix) {
  const out = []; let cursor;
  do { const r = await list({ prefix, cursor, limit: 1000 }); out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  return out;
}
const stamp = b => Number(b.pathname.split('/')[2]?.split('-')[0]?.replace('.json', '')) || new Date(b.uploadedAt).getTime();

export async function readAll(kind) {
  if (!KINDS.has(kind)) throw new Error('bad kind');
  const latest = new Map();
  for (const b of await listAll(kind + '/')) {
    const id = b.pathname.split('/')[1];
    const cur = latest.get(id);
    if (!cur || stamp(b) > stamp(cur)) latest.set(id, b);
  }
  const docs = await Promise.all([...latest].map(async ([id, b]) => {
    try { return { ...JSON.parse(await readText(b.url)), id }; } catch (e) { console.error(e); return null; }
  }));
  return docs.filter(d => d && !d.deleted);
}

export async function writeDoc(kind, id, doc) {
  if (!KINDS.has(kind)) throw new Error('bad kind');
  await putAny(`${kind}/${id}/${Date.now()}.json`, JSON.stringify({ ...doc, id }), {
    addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 60,
  });
  const versions = (await listAll(`${kind}/${id}/`)).sort((a, b) => stamp(b) - stamp(a));
  const old = versions.slice(KEEP).map(b => b.url);
  if (old.length) await del(old);
}

export async function deleteDoc(kind, id) {
  // A tombstone, so earlier versions stay recoverable.
  await writeDoc(kind, id, { deleted: true, deletedAt: Date.now() });
}

export function docHandler(kind) {
  return async function handler(req, res) {
    if (!checkAuth(req, res)) return;
    const id = req.query.id;
    if (!validId(id)) return res.status(400).json({ error: 'Missing or invalid id' });
    try {
      if (req.method === 'PUT') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Body must be a JSON object' });
        if (JSON.stringify(body).length > 2_000_000) return res.status(413).json({ error: 'Too large' });
        delete body.deleted;
        await writeDoc(kind, id, body);
        return res.status(200).json({ ok: true });
      }
      if (req.method === 'DELETE') { await deleteDoc(kind, id); return res.status(200).json({ ok: true }); }
      res.setHeader('Allow', 'PUT, DELETE');
      return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Storage error' });
    }
  };
}
