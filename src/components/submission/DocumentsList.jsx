import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, CheckCircle, XCircle, Download } from 'lucide-react';

const DocumentsList = ({ submission }) => {
  const { toast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumen Persyaratan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submission.requirements.map((requirement, index) => (
            <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    submission.checkedRequirements.includes(index) 
                      ? 'bg-green-500' 
                      : 'bg-gray-500'
                  }`}>
                    {submission.checkedRequirements.includes(index) ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <XCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{requirement}</p>
                    {submission.documents[index] && (
                      <p className="text-sm text-gray-400">
                        {submission.documents[index].name}
                      </p>
                    )}
                  </div>
                </div>
                {submission.documents[index] && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      toast({
                        title: "🚧 Fitur ini belum diimplementasikan—tapi jangan khawatir! Anda bisa memintanya di prompt berikutnya! 🚀"
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Unduh
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DocumentsList;