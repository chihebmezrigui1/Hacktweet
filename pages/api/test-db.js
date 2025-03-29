import dbConnect from 'C:/Users/capel/node_modules/mongoose/mon-projet/lib/db.js';

export default async function handler(req, res) {
  try {
    await dbConnect();
    res.status(200).json({ message: '✅ Connexion MongoDB réussie' });
  } catch (error) {
    res.status(500).json({ error: '❌ Connexion échouée', details: error.message });
  }
}
