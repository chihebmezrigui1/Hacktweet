import dbConnect from './lib/db';
import Tweet from './models/Tweet';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const tweet = await Tweet.findById(id).populate('media hashtags mentions likes retweets replies');
      if (!tweet) return res.status(404).json({ error: 'Tweet non trouvé' });
      res.status(200).json(tweet);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const updatedTweet = await Tweet.findByIdAndUpdate(id, req.body, { new: true });
      res.status(200).json(updatedTweet);
    } catch (error) {
      res.status(400).json({ error: 'Erreur de mise à jour' });
    }
  }

  else if (req.method === 'DELETE') {
    try {
      await Tweet.findByIdAndDelete(id);
      res.status(200).json({ message: 'Tweet supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur de suppression' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
