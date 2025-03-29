import dbConnect from '@/lib/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: 'Erreur de mise à jour' });
    }
  }

  else if (req.method === 'DELETE') {
    try {
      await User.findByIdAndDelete(id);
      res.status(200).json({ message: 'Utilisateur supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
