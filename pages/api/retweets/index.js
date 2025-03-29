import dbConnect from '@/lib/db';
import Retweet from '@/models/Retweet';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const retweets = await Retweet.find({}).populate('user tweet');
      res.status(200).json(retweets);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des retweets' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const newRetweet = new Retweet(req.body);
      await newRetweet.save();
      res.status(201).json(newRetweet);
    } catch (error) {
      res.status(400).json({ error: 'Erreur lors de l’ajout du retweet' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
