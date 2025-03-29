import dbConnect from '@/lib/db';
import Follow from '@/models/Follow';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await Follow.findByIdAndDelete(id);
      res.status(200).json({ message: 'Follow supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du follow' });
    }
  } 

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
