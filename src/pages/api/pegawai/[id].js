import { connectToDatabase } from '../../../lib/mongodb';
import Pegawai from '../../../models/Pegawai';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await connectToDatabase();

  switch (method) {
    case 'GET':
      try {
        const pegawai = await Pegawai.findById(id);
        if (!pegawai) {
          return res.status(404).json({ error: 'Data pegawai tidak ditemukan' });
        }
        res.status(200).json(pegawai);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;

    case 'PUT':
      try {
        const updatedPegawai = await Pegawai.findByIdAndUpdate(
          id,
          { $set: req.body },
          { new: true, runValidators: true }
        );
        if (!updatedPegawai) {
          return res.status(404).json({ error: 'Data pegawai tidak ditemukan' });
        }
        res.status(200).json(updatedPegawai);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const deletedPegawai = await Pegawai.findByIdAndDelete(id);
        if (!deletedPegawai) {
          return res.status(404).json({ error: 'Data pegawai tidak ditemukan' });
        }
        res.status(200).json({ message: 'Data pegawai berhasil dihapus' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
