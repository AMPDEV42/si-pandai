import { connectToDatabase } from '../../../lib/mongodb';
import Pegawai from '../../../models/Pegawai';

export default async function handler(req, res) {
  const { method } = req;
  await connectToDatabase();

  switch (method) {
    case 'GET':
      try {
        const pegawai = await Pegawai.find({}).sort({ createdAt: -1 });
        res.status(200).json(pegawai);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      try {
        const newPegawai = new Pegawai(req.body);
        await newPegawai.save();
        res.status(201).json(newPegawai);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
