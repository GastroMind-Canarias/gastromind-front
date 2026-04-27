# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at localhost:4200 (with proxy)
npm run build      # production build → dist/
npm run watch      # build in watch mode (dev config)
npm test           # Vitest unit tests
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

### Feature Scaffolding Pattern

New features follow this pattern:
- `features/<name>/<name>.routes.ts` — exports lazy route config
- `features/<name>/<name>.component.ts` — standalone component
- `features/<name>/<name>.service.ts` — Signals + HttpClient, no class-level state
- Register in `app.routes.ts` with `loadChildren`
