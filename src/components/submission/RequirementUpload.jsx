/**
 * Individual Requirement Upload Component
 * Handles file upload for each requirement separately with preview functionality
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Eye, 
  Trash2, 
  FileText, 
  Image, 
  File, 
  CheckCircle, 
  AlertCircle,
  Download,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '../ui/use-toast';
import { formatFileSize } from '../../lib/utils';
import { apiLogger } from '../../lib/logger';

const RequirementUpload = ({ 
  requirement, 
  uploadedFile, 
  onFileUpload, 
  onFileRemove,
  isUploading = false,
  className = '' 
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // File type configuration
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const validateFile = (file) => {
    if (!file) {
      throw new Error('Tidak ada file yang dipilih');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Ukuran file maksimal ${formatFileSize(MAX_FILE_SIZE)}`);
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, PNG, atau GIF');
    }

    return true;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateFile(file);
      
      apiLogger.info('File selected for requirement', {
        requirementId: requirement.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Call parent handler
      await onFileUpload(requirement.id, file);

      toast({
        title: 'File berhasil dipilih',
        description: `${file.name} siap diupload`,
      });

    } catch (error) {
      apiLogger.error('File validation failed', {
        requirementId: requirement.id,
        error: error.message
      });

      toast({
        title: 'File tidak valid',
        description: error.message,
        variant: 'destructive'
      });
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = () => {
    if (!uploadedFile) return;

    try {
      // Create preview URL for the file
      let url;
      if (uploadedFile.file) {
        // If it's a File object (not yet uploaded)
        url = URL.createObjectURL(uploadedFile.file);
      } else if (uploadedFile.url) {
        // If it's an uploaded file with URL
        url = uploadedFile.url;
      } else {
        throw new Error('File tidak dapat dipreview');
      }

      setPreviewUrl(url);
      setIsPreviewOpen(true);

      apiLogger.debug('File preview opened', {
        requirementId: requirement.id,
        fileName: uploadedFile.name || uploadedFile.file?.name
      });

    } catch (error) {
      apiLogger.error('Failed to preview file', {
        requirementId: requirement.id,
        error: error.message
      });

      toast({
        title: 'Gagal membuka preview',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemove = () => {
    onFileRemove(requirement.id);
    
    // Clean up preview URL if it exists
    if (previewUrl && uploadedFile?.file) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setIsPreviewOpen(false);

    apiLogger.info('File removed from requirement', {
      requirementId: requirement.id,
      fileName: uploadedFile?.name || uploadedFile?.file?.name
    });

    toast({
      title: 'File dihapus',
      description: 'File telah dihapus dari persyaratan ini',
    });
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="w-5 h-5" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  const isImage = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  const isPDF = (fileType) => {
    return fileType && fileType.includes('pdf');
  };

  const fileType = uploadedFile?.type || uploadedFile?.file?.type;
  const fileName = uploadedFile?.name || uploadedFile?.file?.name;
  const fileSize = uploadedFile?.size || uploadedFile?.file?.size;

  return (
    <>
      <Card className={`border-white/20 bg-white/5 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Requirement Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">
                  {requirement.name}
                </h4>
                {requirement.description && (
                  <p className="text-xs text-gray-400 mt-1">
                    {requirement.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    className={`text-xs ${requirement.required ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}
                  >
                    {requirement.required ? 'Wajib' : 'Opsional'}
                  </Badge>
                  {uploadedFile && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Terupload
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-3">
              {uploadedFile ? (
                /* Uploaded File Display */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-green-400">
                        {getFileIcon(fileType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {fileName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fileSize && formatFileSize(fileSize)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Preview Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePreview}
                        className="p-1 h-8 w-8 text-blue-400 hover:bg-blue-500/20"
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemove}
                        className="p-1 h-8 w-8 text-red-400 hover:bg-red-500/20"
                        title="Hapus file"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Upload Area */
                <div
                  className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-white/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-white">
                        Klik untuk upload file
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, DOC, DOCX, JPG, PNG (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {!uploadedFile && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File
                    </>
                  )}
                </Button>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-white/20">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview: {fileName}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {previewUrl && (
              <div className="bg-white rounded-lg overflow-hidden">
                {isImage(fileType) ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                  />
                ) : isPDF(fileType) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[60vh]"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Preview tidak tersedia untuk tipe file ini
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {fileName}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequirementUpload;
