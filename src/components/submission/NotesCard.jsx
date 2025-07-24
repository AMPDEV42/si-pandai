import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const NotesCard = ({ notes }) => {
  if (!notes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Catatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">{notes}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotesCard;