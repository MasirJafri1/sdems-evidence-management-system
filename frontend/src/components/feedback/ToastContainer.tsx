import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { removeToast } from './toast.slice';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dispatch(removeToast(t.id))} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: any; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    info: <Info className="w-4 h-4 text-blue-700 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />,
    security: <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0" />,
  };

  const borders = {
    info: 'border-blue-300 bg-blue-50 text-blue-900',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    error: 'border-red-300 bg-red-50 text-red-900',
    security: 'border-amber-400 bg-amber-100 text-amber-950',
  };

  return (
    <div className={`pointer-events-auto p-3 rounded border shadow-lg flex items-start gap-2.5 text-xs ${borders[toast.type as keyof typeof borders]}`}>
      {icons[toast.type as keyof typeof icons]}
      <div className="flex-1 space-y-0.5">
        <h5 className="font-bold text-xs">{toast.title}</h5>
        <p className="text-[11px] opacity-90 leading-tight">{toast.message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:opacity-75">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
