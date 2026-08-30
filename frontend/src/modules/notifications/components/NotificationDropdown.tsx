import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { markAsRead, markAllAsRead } from '../notification.slice';
import { Bell, Check } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export const NotificationDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useAppSelector((state) => state.notification.notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSelect = (notif: any) => {
    dispatch(markAsRead(notif.id));
    if (notif.targetPath) {
      navigate(notif.targetPath);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
        title="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-300 rounded shadow-xl z-50 overflow-hidden text-xs text-slate-900">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold">
            <span className="uppercase tracking-wider text-[11px]">System Alerts & Actions ({unreadCount})</span>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <Check className="w-3 h-3" /> Mark All Read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No active notifications.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  className={`p-3 hover:bg-slate-50 cursor-pointer space-y-1 transition-colors ${
                    !n.read ? 'bg-blue-50/50 font-medium' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <Badge variant={n.type === 'Security Alert' ? 'danger' : n.type === 'Action Required' ? 'warning' : 'info'} size="sm">
                      {n.type}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
