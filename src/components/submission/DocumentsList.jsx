import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, CheckCircle, XCircle, Download } from 'lucide-react';

const DocumentsList = ({ submission = {} }) => {
  const { toast } = useToast();

  // Ensure we have valid arrays to work with
  const requirements = Array.isArray(submission.requirements) ? submission.requirements : [];
  const documents = Array.isArray(submission.documents) ? submission.documents : [];
  const checkedRequirements = Array.isArray(submission.checkedRequirements) ? submission.checkedRequirements : [];

  if (requirements.length === 0) {
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
          <CardContent>
            <p className="text-gray-400">Tidak ada dokumen persyaratan yang tersedia.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

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
          {requirements.map((requirement, index) => {
            const document = documents[index] || {};
            const isChecked = checkedRequirements.includes(index);
            
            return (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isChecked ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {isChecked ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{requirement || `Persyaratan ${index + 1}`}</p>
                      {document?.name && (
                        <p className="text-sm text-gray-400">
                          {document.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {document?.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                      onClick={() => {
                        // Handle download
                        toast({
                          title: "Mengunduh dokumen",
                          description: `Mengunduh ${document.name || 'dokumen'}`,
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" /> Unduh
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DocumentsList;