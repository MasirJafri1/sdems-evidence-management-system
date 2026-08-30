import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/store/auth.slice';
import caseReducer from '../modules/cases/store/case.slice';
import documentReducer from '../modules/documents/store/document.slice';
import custodyReducer from '../modules/custody/store/custody.slice';
import toastReducer from '../components/feedback/toast.slice';
import notificationReducer from '../modules/notifications/notification.slice';

export const rootReducer = combineReducers({
  auth: authReducer,
  cases: caseReducer,
  documents: documentReducer,
  custody: custodyReducer,
  toast: toastReducer,
  notification: notificationReducer,
});
