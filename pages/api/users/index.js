import dbConnect from '@/lib/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const users = await User.find({});
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ error: 'Erreur lors de la création de l’utilisateur' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
