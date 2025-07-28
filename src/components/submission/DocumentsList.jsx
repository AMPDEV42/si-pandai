import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, CheckCircle, XCircle, Download, File, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const DocumentsList = ({ submission = {} }) => {
  const { toast } = useToast();
  const [expandedDoc, setExpandedDoc] = useState(null);

  // Ensure we have valid arrays to work with
  const requirements = Array.isArray(submission.requirements) 
    ? submission.requirements 
    : (submission.requirements_data ? Object.entries(submission.requirements_data).map(([key, value]) => ({
        id: key,
        name: value.name || key,
        description: value.description || '',
        required: value.required !== false
      })) : []);

  const documents = Array.isArray(submission.documents) 
    ? submission.documents 
    : [];

  const checkedRequirements = Array.isArray(submission.checked_requirements) 
    ? submission.checked_requirements 
    : [];

  // Handle document download
  const handleDownload = async (document) => {
    if (!document?.url) return;
    
    try {
      // If it's a public URL, open in new tab
      if (document.url.startsWith('http')) {
        window.open(document.url, '_blank');
        return;
      }
      
      // If it's a Supabase storage path, download it
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.url);
      
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Berhasil",
        description: `Dokumen ${document.name || ''} berhasil diunduh`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Gagal mengunduh dokumen",
        description: error.message || 'Terjadi kesalahan saat mengunduh dokumen',
        variant: "destructive"
      });
    }
  };

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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <File className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Tidak ada dokumen persyaratan</h3>
              <p className="text-gray-400 max-w-md">
                Tidak ada dokumen persyaratan yang diperlukan untuk pengajuan ini.
              </p>
            </div>
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
            <span className="text-sm text-gray-400 font-normal ml-2">
              {checkedRequirements.length} dari {requirements.length} terpenuhi
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requirements.map((requirement, index) => {
            const requirementId = requirement.id || requirement.name || `req-${index}`;
            const document = documents.find(doc => 
              doc.requirement_id === requirementId || 
              doc.name === requirement.name ||
              doc.id === requirementId
            ) || {};
            
            const isChecked = checkedRequirements.includes(requirementId) || 
                            checkedRequirements.includes(index) ||
                            (document && document.verified);
            
            const isExpanded = expandedDoc === index;
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${isChecked ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'} border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isChecked ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {isChecked ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium">
                          {requirement.name || `Persyaratan ${index + 1}`}
                        </h4>
                        {requirement.required && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                            Wajib
                          </span>
                        )}
                      </div>
                      
                      {requirement.description && (
                        <p className="text-sm text-gray-300 mt-1">
                          {requirement.description}
                        </p>
                      )}
                      
                      {document?.name && (
                        <div className="mt-2 p-2 bg-white/5 rounded-md border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-white">{document.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {document.verified && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Tervalidasi
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 h-8 px-2"
                                onClick={() => handleDownload(document)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {document.uploaded_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              Diunggah pada: {new Date(document.uploaded_at).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {!document?.name && (
                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-300">
                            {requirement.required 
                              ? 'Dokumen wajib ini belum diunggah' 
                              : 'Dokumen opsional ini belum diunggah'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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