import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  type: 'Informational' | 'Action Required' | 'Warning' | 'Security Alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetPath?: string;
}

interface NotificationState {
  notifications: AppNotification[];
}

const initialState: NotificationState = {
  notifications: [
    {
      id: 'notif-real-1',
      type: 'Informational',
      title: 'Secure System Session Active',
      message: 'Logged in as Chief Administrator under Central Bureau of Investigation.',
      timestamp: new Date().toISOString(),
      read: false,
      targetPath: '/dashboard',
    },
  ],
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'timestamp' | 'read'>>) => {
      state.notifications.unshift({
        ...action.payload,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.notifications.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
