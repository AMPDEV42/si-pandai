import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, FileIcon, FileType, FileArchive, FileImage, ChevronUp, ChevronDown, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const getFileIcon = (fileName) => {
  if (!fileName) return <FileType className="w-5 h-5" />;
  
  const ext = fileName.split('.').pop().toLowerCase();
  
  if (['pdf'].includes(ext)) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-blue-500" />;
  }
  
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-400" />;
  }
  
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-orange-500" />;
  }
  
  return <FileIcon className="w-5 h-5 text-gray-400" />;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const RequirementsChecklist = ({ submissionType, formData, handleFileUpload, handleRequirementCheck, uploading = {} }) => {
  const [activeAccordion, setActiveAccordion] = useState(null);
  
  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Persyaratan Dokumen</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Unggah dan verifikasi semua dokumen yang dibutuhkan untuk pengajuan ini
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="space-y-3">
        {submissionType.requirements.map((requirement, index) => {
          const isChecked = formData.checkedRequirements.includes(index);
          const hasFile = !!formData.documents[index];
          const file = formData.documents[index];
          
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-xl overflow-hidden border transition-all duration-300",
                isChecked 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-gray-700/50 bg-gray-800/30 hover:bg-gray-700/30"
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <Checkbox
                      id={`req-${index}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleRequirementCheck(index, checked)}
                      disabled={uploading[index]}
                      className={cn(
                        "h-5 w-5 rounded-md border-2 transition-colors",
                        isChecked 
                          ? "border-green-500 bg-green-500 text-green-500" 
                          : "border-gray-500 hover:border-gray-400",
                        uploading[index] ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Label 
                        htmlFor={`req-${index}`} 
                        className={cn(
                          "text-sm font-medium cursor-pointer select-none",
                          isChecked ? "text-green-400" : "text-white"
                        )}
                      >
                        {requirement}
                      </Label>
                      
                      <button 
                        onClick={() => toggleAccordion(index)}
                        className="text-gray-400 hover:text-white p-1 -mr-2"
                      >
                        {activeAccordion === index ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {activeAccordion === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-4">
                            {!hasFile ? (
                              <div className={cn("flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center", 
                                uploading[index] 
                                  ? "border-blue-500 bg-blue-500/10" 
                                  : "border-gray-700 hover:border-blue-500/50 cursor-pointer"
                              )}>
                                {uploading[index] ? (
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                                ) : (
                                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                )}
                                <p className="text-sm text-gray-400 mb-3">
                                  {uploading[index] ? 'Mengunggah...' : 'Unggah file untuk persyaratan ini'}
                                </p>
                                <input
                                  type="file"
                                  id={`file-${index}`}
                                  onChange={(e) => handleFileUpload(index, e)}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Button
                                  type="button"
                                  onClick={() => document.getElementById(`file-${index}`).click()}
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                                >
                                  Pilih File
                                </Button>
                                <p className="text-xs text-gray-500 mt-2">Format: PDF, DOC, DOCX, JPG, PNG (Maks. 5MB)</p>
                              </div>
                            ) : (
                              <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-700/50 rounded-lg">
                                      {getFileIcon(file.name)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-white truncate max-w-xs">{file.name}</p>
                                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-400 hover:bg-gray-700/50 hover:text-white"
                                      onClick={() => {
                                        // Handle file preview
                                        const fileUrl = URL.createObjectURL(file);
                                        window.open(fileUrl, '_blank');
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                      onClick={() => handleFileUpload(index, { target: { files: [] } })}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                                    onClick={() => document.getElementById(`file-${index}`).click()}
                                  >
                                    Ganti File
                                  </Button>
                                </div>
                                
                                <input
                                  type="file"
                                  id={`file-${index}`}
                                  onChange={(e) => handleFileUpload(index, e)}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {hasFile && !isChecked && (
                  <div className="mt-3 ml-9">
                    <p className="text-xs text-yellow-400 flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      Centang untuk memverifikasi dokumen ini sudah sesuai
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RequirementsChecklist;