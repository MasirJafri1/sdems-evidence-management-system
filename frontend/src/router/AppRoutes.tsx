import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.config';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { CasesPage } from '../modules/cases/pages/CasesPage';
import { CaseDetailsPage } from '../modules/cases/pages/CaseDetailsPage';
import { DocumentsPage } from '../modules/documents/pages/DocumentsPage';
import { DocumentDetailsPage } from '../modules/documents/pages/DocumentDetailsPage';
import { EvidencePage } from '../modules/evidence/pages/EvidencePage';
import { EvidenceDetailsPage } from '../modules/evidence/pages/EvidenceDetailsPage';
import { VerificationPage } from '../modules/verification/pages/VerificationPage';
import { AuditPage } from '../modules/audit/pages/AuditPage';
import { UsersPage } from '../modules/users/pages/UsersPage';
import { OrganizationsPage } from '../modules/organizations/pages/OrganizationsPage';
import { CustodyPage } from '../modules/custody/pages/CustodyPage';
import { ReportsPage } from '../modules/reports/pages/ReportsPage';
import { SettingsPage } from '../modules/settings/pages/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path={ROUTES.PUBLIC.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.PROTECTED.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PROTECTED.CASES.LIST} element={<CasesPage />} />
        <Route path={ROUTES.PROTECTED.CASES.DETAIL} element={<CaseDetailsPage />} />
        <Route path={ROUTES.PROTECTED.DOCUMENTS.LIST} element={<DocumentsPage />} />
        <Route path={ROUTES.PROTECTED.DOCUMENTS.DETAIL} element={<DocumentDetailsPage />} />
        <Route path={ROUTES.PROTECTED.EVIDENCE.LIST} element={<EvidencePage />} />
        <Route path={ROUTES.PROTECTED.EVIDENCE.DETAIL} element={<EvidenceDetailsPage />} />
        <Route path={ROUTES.PROTECTED.CUSTODY.LIST} element={<CustodyPage />} />
        <Route path={ROUTES.PROTECTED.CUSTODY.DETAIL} element={<EvidenceDetailsPage />} />
        <Route path={ROUTES.PROTECTED.VERIFICATION} element={<VerificationPage />} />
        <Route path={ROUTES.PROTECTED.AUDIT} element={<AuditPage />} />
        <Route path={ROUTES.PROTECTED.USERS} element={<UsersPage />} />
        <Route path={ROUTES.PROTECTED.ROLES} element={<UsersPage />} />
        <Route path={ROUTES.PROTECTED.PERMISSIONS} element={<UsersPage />} />
        <Route path={ROUTES.PROTECTED.ORGANIZATIONS} element={<OrganizationsPage />} />
        <Route path={ROUTES.PROTECTED.REPORTS} element={<ReportsPage />} />
        <Route path={ROUTES.PROTECTED.SETTINGS} element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.PROTECTED.DASHBOARD} replace />} />
    </Routes>
  );
};
