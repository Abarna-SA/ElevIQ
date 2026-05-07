# TODO Tasks

## Phase 1: Foundation & Security
- [ ] Initialize Firebase Web SDK (`src/config/firebase.ts`).
- [ ] Initialize Firebase Admin SDK for backend routines (`src/lib/firebase-admin.ts`).
- [ ] Define global collection schemas and TypeScript types in `src/domain/models/`.
- [ ] Setup advanced `firestore.rules` for data security and multi-tenant isolation.
- [ ] Construct Custom JWT generation via Firebase Custom Tokens & HttpOnly Cookie storage via Next.js middleware.
- [ ] Strip `auth-store.ts` local persist module and wire to Auth Context.

## Phase 2: Core Data Migration
- [ ] Build Firestore repositories in `src/infrastructure/firebase/repositories`.
- [ ] Create `useExpensesSubscription` and `useVehiclesSubscription` real-time hooks replacing pure Zustand arrays.
- [ ] Completely gut `expense-store.ts` and `vehicle-store.ts` to only manage UI view state (no caching).
- [ ] Migrate `api/v1/scan-receipt` to save output directly to the user's `expenses` Firestore collection.

## Phase 3: Total Feature Integration
- [ ] Connect `chat/page.tsx` to Firestore `conversations` and `messages` sub-collections; remove `mockConversations` array.
- [ ] Wire Dashboard aggregates (Net Worth, Goals, Bills, Insights) to listen to Firestore records, removing static placeholders.
- [ ] Integrate Firebase Storage for receipt/document uploads.
- [ ] Final purge audit: Ensure 0 instances of `localStorage.setItem` for user payload, and 0 references to `mock` data lists across `src/`.
