# Frontend Architecture & Folder Structure Guidelines

This document outlines the architecture, file organization rules, and module design pattern for this project. **All developers must adhere to these guidelines.**

---

## 🚨 Core Rules

1. **Modular Architecture (Feature-Driven)**: 
   - Group code by **feature/domain module** (e.g., `auth`, `dashboard`, `user`, `analytics`), matching the modular organization of the backend.
   - Avoid dumping all components or hooks into a single flat directory.

2. **No Monolithic Files (Strict File Size Limit)**:
   - **Maximum ~150 lines per file**.
   - If a page or component exceeds this size, break it down into sub-components, custom hooks, helper utilities, or constants.

3. **Separation of Concerns**:
   - **UI Component**: Focuses *only* on rendering JSX and visual state.
   - **Custom Hook (`use...`)**: Handles complex logic, state transitions, side effects, and API interactions.
   - **Util/Helper (`...util.ts` / `...helpers.ts`)**: Pure data transformations, formatters, and calculations.
   - **Services/API (`...api.ts`)**: Axios requests and API endpoint calls.
   - **Schemas (`...schema.ts`)**: Zod validation schemas.
   - **Types (`...types.ts`)**: TypeScript interfaces and types.

---

## 📁 Recommended Folder Structure

```text
src/
├── assets/                    # Static assets (images, fonts, global SVGs)
├── components/                # Shared UI primitives across all modules
│   ├── ui/                    # Base UI buttons, inputs, modals, cards
│   ├── layout/                # Navbar, Sidebar, Footer, PageWrapper
│   └── feedback/              # Loaders, Toasts, Error Boundaries
│
├── config/                    # Global app configuration
│   ├── axios.config.ts        # Axios instances & interceptors
│   ├── env.config.ts          # Validated environment variables
│   └── routes.config.ts       # Centralized route paths
│
├── hooks/                     # Global/Shared custom hooks
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
│
├── store/                     # Redux Toolkit global store configuration
│   ├── index.ts               # Store configuration & typed hooks (useAppDispatch, useAppSelector)
│   └── rootReducer.ts         # Root slice combiners
│
├── utils/                     # Global helper functions
│   ├── formatters.ts          # Currency, date, string formatting
│   └── validation.ts          # Generic validation helpers
│
├── modules/                   # 🟢 FEATURE-BASED MODULES (Domain-driven)
│   ├── auth/                  # Example: Auth Module
│   │   ├── api/               # Auth API calls (axios)
│   │   │   └── auth.api.ts
│   │   ├── components/        # Auth-specific UI sub-components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthCard.tsx
│   │   ├── hooks/             # Auth-specific custom hooks
│   │   │   ├── useLogin.ts
│   │   │   └── useRegister.ts
│   │   ├── pages/             # Auth page wrappers (thin entry points)
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── schemas/           # Auth Zod schemas
│   │   │   └── auth.schema.ts
│   │   ├── store/             # Auth Redux slice
│   │   │   └── auth.slice.ts
│   │   ├── types/             # Auth TypeScript interfaces
│   │   │   └── auth.types.ts
│   │   └── utils/             # Auth-specific utility functions
│   │       └── auth.util.ts
│   │
│   ├── dashboard/             # Example: Dashboard Module
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── ...
│   │
│   └── [feature_name]/        # Other domain modules follow the exact same structure
│
├── router/                    # React Router configuration
│   ├── AppRoutes.tsx          # Route definitions & lazy loading
│   ├── ProtectedRoute.tsx     # Auth guards
│   └── PublicRoute.tsx
│
├── styles/                    # Global CSS / Tailwind directives
├── App.tsx                    # Top-level app wrapper (Providers, Store, Router)
└── main.tsx                   # React entry point
```

---

## 🛠 File-by-File Breakdown Rules

### 1. Pages (`modules/[feature]/pages/`)
- Pages are **thin wrapper components**.
- Responsibility: Layout placement, connecting top-level hooks to components, and routing integration.
- Max size: ~50-80 lines.

### 2. Components (`modules/[feature]/components/`)
- Break complex UIs into small, single-purpose components (e.g., `UserTable.tsx`, `UserTableRow.tsx`, `UserFilterHeader.tsx`).
- Components receive data and callbacks via `props`.
- Do not write API calls or inline Redux dispatch logic inside presenter components if it bloats the file.

### 3. Hooks (`modules/[feature]/hooks/`)
- Extract form handling, data fetching, Redux selectors, and state orchestration here.
- Example: `useLoginForm.ts` manages Zod validation, submission handling, loading states, and error alerts.

### 4. API Services (`modules/[feature]/api/`)
- Define raw API calls separated from React lifecycle.
- Keep Axios configurations clean and return strongly-typed responses.

### 5. Redux Slices (`modules/[feature]/store/`)
- One slice per module.
- Keep Reducers pure and concise.

---

## 🏷 Naming Conventions

| Artifact Type | File Naming Pattern | Export Pattern |
|---|---|---|
| React Component | `PascalCase.tsx` | Named export or default export |
| Custom Hook | `useCamelCase.ts` | Named export |
| Utility Function | `camelCase.util.ts` | Named export |
| API Service | `feature.api.ts` | Named export |
| Zod Schema | `feature.schema.ts` | Named export |
| Redux Slice | `feature.slice.ts` | Default slice reducer, named actions |
| TypeScript Types | `feature.types.ts` | Named export |

---

## ✅ Checklist Before Committing Code

- [ ] Is the code organized inside its respective domain module under `src/modules/`?
- [ ] Is any single file exceeding ~150 lines? If yes, split it up.
- [ ] Is business/API/state logic extracted into a custom hook or service file?
- [ ] Are form validation schemas defined with Zod in `.schema.ts` files?
- [ ] Are all types and interfaces declared in `.types.ts` files?
