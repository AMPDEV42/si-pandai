import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const VerificationActions = ({ submission, actionNotes, setActionNotes, handleStatusUpdate, loading }) => {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Tindakan Verifikasi
        </CardTitle>
        <CardDescription className="text-gray-300">
          Berikan keputusan untuk usulan ini
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="action-notes" className="text-gray-200">
            Catatan Verifikasi
          </Label>
          <Textarea
            id="action-notes"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Berikan catatan atau alasan keputusan..."
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleStatusUpdate('approved')}
            disabled={loading || submission.status === 'approved'}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Setujui Usulan
          </Button>

          <Button
            onClick={() => handleStatusUpdate('revision')}
            disabled={loading || submission.status === 'revision'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Minta Revisi
          </Button>

          <Button
            onClick={() => handleStatusUpdate('rejected')}
            disabled={loading || submission.status === 'rejected'}
            variant="destructive"
            className="w-full"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Tolak Usulan
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Memproses...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationActions;