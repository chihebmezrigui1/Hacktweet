import dbConnect from '@/lib/db';
import Follow from '@/models/Follow';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const follows = await Follow.find({}).populate('follower following');
      res.status(200).json(follows);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des follows' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const newFollow = new Follow(req.body);
      await newFollow.save();
      res.status(201).json(newFollow);
    } catch (error) {
      res.status(400).json({ error: 'Erreur lors de l’ajout du follow' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

