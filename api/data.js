import { checkAuth, readAll } from './_store.js';
export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  try {
    const [designs, catalog] = await Promise.all([readAll('designs'), readAll('catalog')]);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ designs, catalog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Storage error' });
  }
}
