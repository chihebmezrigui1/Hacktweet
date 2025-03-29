import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await Bookmark.findByIdAndDelete(id);
      res.status(200).json({ message: 'Bookmark supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du bookmark' });
    }
  } 

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
