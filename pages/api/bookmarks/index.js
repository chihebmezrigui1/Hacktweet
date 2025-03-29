import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const bookmarks = await Bookmark.find({}).populate('user tweet');
      res.status(200).json(bookmarks);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des bookmarks' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const newBookmark = new Bookmark(req.body);
      await newBookmark.save();
      res.status(201).json(newBookmark);
    } catch (error) {
      res.status(400).json({ error: 'Erreur lors de l’ajout du bookmark' });
    }
  }

  else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
