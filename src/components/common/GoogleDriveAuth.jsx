/**
 * Google Drive Authentication Component
 * Handles Google Drive authentication and status display
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudOff, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { googleDriveService } from '../../services/googleDriveService';
import { apiLogger } from '../../lib/logger';

const GoogleDriveAuth = ({ onAuthChange = () => {}, className = '' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConfiguration();
    checkAuthentication();
  }, []);

  const checkConfiguration = () => {
    const configured = googleDriveService.isConfigured();
    setIsConfigured(configured);
    
    if (!configured) {
      setError('Google Drive belum dikonfigurasi. Hubungi administrator untuk menambahkan environment variables.');
    }
  };

  const checkAuthentication = async () => {
    try {
      const authenticated = await googleDriveService.isAuthenticated();
      setIsAuthenticated(authenticated);
      onAuthChange(authenticated);
    } catch (error) {
      apiLogger.error('Failed to check Google Drive authentication', error);
      setIsAuthenticated(false);
      onAuthChange(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      await googleDriveService.authenticate();
      setIsAuthenticated(true);
      onAuthChange(true);

      apiLogger.info('Google Drive authentication successful');

    } catch (error) {
      apiLogger.error('Google Drive authentication failed', error);
      setError('Gagal melakukan autentikasi Google Drive. Pastikan popup tidak diblokir.');
      setIsAuthenticated(false);
      onAuthChange(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isConfigured) {
    return (
      <Card className={`border-amber-500/20 bg-amber-500/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-300">Google Drive Belum Dikonfigurasi</h4>
              <p className="text-sm text-amber-200/80 mt-1">
                Environment variables untuk Google Drive belum diatur
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-white/20 bg-white/5 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isAuthenticated ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                {isAuthenticated ? (
                  <Cloud className="w-5 h-5 text-green-400" />
                ) : (
                  <CloudOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-white">Google Drive</h4>
                <p className="text-sm text-gray-400">
                  Integrasi untuk penyimpanan dokumen
                </p>
              </div>
            </div>
            
            <Badge 
              className={`text-xs ${
                isAuthenticated 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}
            >
              {isAuthenticated ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Terhubung
                </>
              ) : (
                'Belum Terhubung'
              )}
            </Badge>
          </div>

          {/* Status Description */}
          <div className="text-sm text-gray-300">
            {isAuthenticated ? (
              <p>✓ Dokumen akan disimpan otomatis ke Google Drive dengan struktur folder yang terorganisir</p>
            ) : (
              <p>Dokumen akan disimpan sementara. Hubungkan ke Google Drive untuk penyimpanan yang lebih aman.</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Authentication Button */}
          {!isAuthenticated && (
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Hubungkan ke Google Drive
                </>
              )}
            </Button>
          )}

          {/* Info for authenticated state */}
          {isAuthenticated && (
            <div className="text-xs text-gray-500 bg-white/5 p-2 rounded border border-white/10">
              <strong>Struktur Folder:</strong> SIPANDAI ��� [Kategori Pengajuan] → [Nama Pegawai] → [Dokumen]
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveAuth;
