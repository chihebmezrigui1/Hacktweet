import dbConnect from '@/lib/db';
import Like from '@/models/Like';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const likes = await Like.find({}).populate('user tweet');
      res.status(200).json(likes);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des likes' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const newLike = new Like(req.body);
      await newLike.save();
      res.status(201).json(newLike);
    } catch (error) {
      res.status(400).json({ error: 'Erreur lors de l’ajout du like' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
