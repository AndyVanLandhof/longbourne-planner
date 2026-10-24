import { checkAuth, validId, writeDoc, deleteDoc, putAny, readBuffer, list } from './_store.js';

// Finishes: metadata is a small JSON doc; an uploaded image is stored as its own blob.
// GET ?id= returns the image (ids are random and images aren't sensitive, so no passcode is needed to fetch one).
export default async function handler(req, res) {
  const id = req.query.id;
  if (!validId(id)) return res.status(400).json({ error: 'Missing or invalid id' });
  try {
    if (req.method === 'GET') {
      const all = (await list({ prefix: `teximg/${id}/` })).blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
      if (!all.length) return res.status(404).json({ error: 'Not found' });
      const buf = await readBuffer(all[0].url);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(buf);
    }
    if (!checkAuth(req, res)) return;
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Body must be a JSON object' });
      if (typeof body.data === 'string' && body.data.startsWith('data:image/')) {
        const buf = Buffer.from(body.data.split(',')[1] || '', 'base64');
        if (buf.length > 3_000_000) return res.status(413).json({ error: 'Image too large' });
        await putAny(`teximg/${id}/${Date.now()}.jpg`, buf, { addRandomSuffix: true, contentType: 'image/jpeg' });
        body.hasImage = true;
      }
      delete body.data;
      delete body.deleted;
      await writeDoc('textures', id, body);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') { await deleteDoc('textures', id); return res.status(200).json({ ok: true }); }
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Storage error' });
  }
}
