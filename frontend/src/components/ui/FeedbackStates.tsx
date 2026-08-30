import React from 'react';
import { AlertTriangle, Inbox, Lock } from 'lucide-react';
import { Button } from './Button';

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="py-12 px-4 text-center border border-dashed border-slate-300 rounded bg-slate-50">
    <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-2" />
    <h4 className="text-sm font-bold text-slate-800">{title}</h4>
    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">{description}</p>
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="p-4 rounded border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry Request
      </Button>
    )}
  </div>
);

export const PermissionDenied: React.FC<{ reason?: string }> = ({ reason }) => (
  <div className="p-8 text-center border border-red-200 bg-red-50 rounded space-y-3">
    <Lock className="w-10 h-10 text-red-600 mx-auto" />
    <h3 className="text-sm font-bold text-red-900">Access Restricted by Security Policy</h3>
    <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
      {reason || 'Your account level or current case participation scope does not hold authorization to access this record.'}
    </p>
  </div>
);
