import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

const AdditionalNotes = ({ notes, setNotes }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Catatan Tambahan
          </CardTitle>
          <CardDescription className="text-gray-300">
            Tambahkan informasi atau catatan khusus jika diperlukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Masukkan catatan tambahan..."
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdditionalNotes;