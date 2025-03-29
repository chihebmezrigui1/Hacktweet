import dbConnect from '@/lib/db';
import Tweet from '@/models/Tweet';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const tweets = await Tweet.find({}).populate('media hashtags mentions likes retweets replies');
      res.status(200).json(tweets);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const newTweet = new Tweet(req.body);
      await newTweet.save();
      res.status(201).json(newTweet);
    } catch (error) {
      res.status(400).json({ error: 'Erreur de création du tweet' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
