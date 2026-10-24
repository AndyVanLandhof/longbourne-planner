import { checkAuth, readAll } from './_store.js';
export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  try {
    const [designs, catalog, textures] = await Promise.all([readAll('designs'), readAll('catalog'), readAll('textures')]);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ designs, catalog, textures });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Storage error' });
  }
}
