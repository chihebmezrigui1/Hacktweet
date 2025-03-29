import dbConnect from '@/lib/db';
import Like from '@/models/Like';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await Like.findByIdAndDelete(id);
      res.status(200).json({ message: 'Like supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du like' });
    }
  } 

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
