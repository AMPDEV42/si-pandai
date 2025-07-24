import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const HistoryTimeline = ({ submission, getStatusColor, getStatusText }) => {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Riwayat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="text-white font-medium">Usulan Diajukan</p>
              <p className="text-sm text-gray-400">
                {new Date(submission.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
          
          {submission.reviewedAt && (
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(submission.status)}`}></div>
              <div>
                <p className="text-white font-medium">
                  {getStatusText(submission.status)}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(submission.reviewedAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryTimeline;