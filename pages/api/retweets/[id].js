import dbConnect from '@/lib/db';
import Retweet from '@/models/Retweet';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await Retweet.findByIdAndDelete(id);
      res.status(200).json({ message: 'Retweet supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du retweet' });
    }
  } 

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
