# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at localhost:4200 (with proxy)
npm run build      # production build → dist/
npm run watch      # build in watch mode (dev config)
npm test           # Vitest unit tests (all)
npx vitest run src/app/path/to/file.spec.ts   # single test file
ng generate ...    # Angular schematics (component, service, guard, etc.)
```

## Architecture

**Stack:** Angular 21, standalone components, Signals for state, RxJS only for HTTP, pure CSS with custom properties, Vitest for tests.

**Dependency direction (enforce this):**
```
layout → features → shared → core
```
`core` imports nothing from app layers. `shared` imports only from `core`. Never reverse this flow.

### State Management

All UI state uses **Angular Signals** — no NgRx, no BehaviorSubjects for state. RxJS (`forkJoin`, `HttpClient`) is used exclusively for async HTTP.

`AuthStore` (`core/store/auth.store.ts`) holds the global auth state via private signals exposed as read-only. Token is mirrored in `localStorage` for page-refresh hydration.

### Auth Flow

1. `POST /api/v1/auth/login` → receives JWT
2. `GET /api/v1/users/me` (manual `Authorization` header) → validates `role === 'ROLE_ADMIN'`
3. `AuthStore.setAuth(token, user)` → writes localStorage + signals
4. On refresh: `LayoutComponent.ngOnInit()` detects token with no `currentUser` → calls `AuthService.loadCurrentUser()` (interceptor auto-attaches the token)

### HTTP Interceptor

Functional `HttpInterceptorFn` (`core/interceptors/auth.interceptor.ts`) — adds `Authorization: Bearer <token>` to all requests unless the request already has an `Authorization` header (login call uses manual header).

### Routing

```
/login              → LoginComponent (public)
/                   → LayoutComponent (authGuard)
  /dashboard        → DashboardComponent (lazy)
  /users            → stub (lazy)
  /households       → stub (lazy)
  /fridges          → stub (lazy)
  /tickets          → stub (lazy)
** → redirect /dashboard
```

All private routes are children of the shell route guarded by `authGuard` (`core/guards/auth.guard.ts`).

### Proxy

Dev server proxies `/api/*` → `http://100.97.191.102:8081` (configured in `proxy.conf.json` and `angular.json`). All service URLs use relative paths like `/api/v1/...`.

### Styling

CSS custom properties only — no SCSS, no UI library. Design tokens live in `src/styles/_variables.css`. Component styles are scoped `.css` files. Breakpoints: 960px (tablet) and 480px (mobile).

### Modal System

Single `ModalComponent` mounted in `LayoutComponent`. `ModalService` (`core/services/modal.service.ts`) opens modals via signal; `.open()` returns a `Promise<result>`, `.close(result)` resolves it. Never mount multiple modal outlets.

### Toast Notifications

`ToastService` (`shared/toast/toast.service.ts`) — inject and call convenience methods:
```ts
this.toast.success('Done');
this.toast.error('Failed');   // auto-dismisses after 5000ms
this.toast.info('...');
this.toast.warning('...');
```
`ToastComponent` is mounted once in `LayoutComponent`.

### Confirm Dialogs

`ConfirmDialogService` (`shared/confirm-dialog/`) — two-step confirmation UI. Returns `Promise<boolean>`:
```ts
const ok = await this.confirm.confirm({ title, message, entityName });
if (!ok) return;
```
Guard every destructive action (delete, remove member, etc.) with this pattern.

### Service Signal Pattern

Feature services follow this structure — signals for state, RxJS only for the HTTP call:
```ts
readonly items    = signal<Item[]>([]);
readonly isLoading = signal(false);
readonly error    = signal<string | null>(null);

loadAll() {
  this.isLoading.set(true);
  this.http.get<Item[]>('/api/v1/...').subscribe({
    next:  v => { this.items.set(v); this.isLoading.set(false); },
    error: e => { this.error.set(e.message); this.isLoading.set(false); },
  });
}
```
After any mutation (`delete`, `update`, `create`) call `loadAll()` or `loadById()` to refresh — no optimistic updates. Expose signals as `.asReadonly()` when injected by components.

Use `computed()` for derived state (e.g., `availableAppliances`, `hasData`). Use `effect()` in components to react to service signal changes (e.g., sync `selectedUser` → local form state).

### Domain Enums

User roles: `ROLE_ADMIN | ROLE_OWNER | ROLE_MEMBER | ROLE_PREMIUM_MEMBER | ROLE_TESTS`

Appliance types (`core/models/households.models.ts`):
`HORNO | MICROONDAS | AIR_FRYER | VITROCERAMICA | ROBOT_COCINA | BATIDORA | OLLA_EXPRESS`
Use `APPLIANCE_LABELS` map for display names and `ALL_APPLIANCES` array for selects.

### API Endpoints

```
POST   /api/v1/auth/login
GET    /api/v1/users/me
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id/role?newRole=<role>
DELETE /api/v1/users/:id

GET    /api/v1/households
GET    /api/v1/households/:id
POST   /api/v1/households/:id/appliances?appliance=<type>
POST   /api/v1/households/:id/invite
GET    /api/v1/households/:id/members
PATCH  /api/v1/households/:id/promote/:userId
DELETE /api/v1/households/:id/members/:userId
DELETE /api/v1/households/:id

GET    /api/v1/tickets

GET    /api/v1/fridges
GET    /api/v1/fridges/:id
POST   /api/v1/fridges                                      { household_id }
PUT    /api/v1/fridges/:id                                  { household_id }
DELETE /api/v1/fridges/:id

GET    /api/v1/fridge-items/fridge/:fridgeId
GET    /api/v1/fridge-items/fridge/:fridgeId/expiring
GET    /api/v1/fridge-items/fridge/:fridgeId/category/:categoryId
POST   /api/v1/fridge-items                                 { productId, fridgeId, quantity, expirationDate, status }
PUT    /api/v1/fridge-items/:id                             (update stock)
DELETE /api/v1/fridge-items/:id
PUT    /api/v1/fridge-items/:id/mark-consumed
PUT    /api/v1/fridge-items/:id/consume                     { quantity }
```

### Dependency Injection

All components and services use the functional `inject()` API — never constructor injection:
```ts
private readonly svc = inject(UsersService);
private readonly toast = inject(ToastService);
```
Services that components inject should expose signals as `.asReadonly()`.

### Feature Scaffolding Pattern

New features follow this pattern:
- `features/<name>/<name>.routes.ts` — exports lazy route config
- `features/<name>/<name>.component.ts` — standalone component
- `features/<name>/<name>.service.ts` — Signals + HttpClient, no class-level state
- Register in `app.routes.ts` with `loadChildren` (multi-route) or `loadComponent` (single component)

`/tickets` is currently a stub awaiting implementation.
