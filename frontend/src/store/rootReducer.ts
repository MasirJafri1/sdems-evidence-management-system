import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/store/auth.slice';
import caseReducer from '../modules/cases/store/case.slice';
import documentReducer from '../modules/documents/store/document.slice';
import custodyReducer from '../modules/custody/store/custody.slice';
import toastReducer from '../components/feedback/toast.slice';
import notificationReducer from '../modules/notifications/notification.slice';
import organizationReducer from '../modules/organizations/store/organization.slice';
import evidenceReducer from '../modules/evidence/store/evidence.slice';
import blockchainReducer from '../modules/blockchain/store/blockchain.slice';
import authorizationReducer from '../modules/authorization/store/authorization.slice';
import auditReducer from '../modules/audit/store/audit.slice';

export const rootReducer = combineReducers({
  auth: authReducer,
  cases: caseReducer,
  documents: documentReducer,
  custody: custodyReducer,
  toast: toastReducer,
  notification: notificationReducer,
  organization: organizationReducer,
  evidence: evidenceReducer,
  blockchain: blockchainReducer,
  authorization: authorizationReducer,
  audit: auditReducer,
});
