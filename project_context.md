# Fridge Admin — Project Context

Documento vivo que resume arquitectura, paleta, rutas y guías de estilo.
Mantener actualizado en cada PR que toque estructura o diseño.

---

## 1. Stack

- **Angular 18** (standalone components, Signals, control flow `@if` / `@for` / `@switch`).
- **CSS puro** con custom properties (design tokens). Sin preprocesadores.
- **RxJS** sólo donde realmente aporta (HTTP, streams). Estado de UI → Signals.
- Iconos: **SVG inline** (evita dependencia de librerías, hereda `currentColor`).

---

## 2. Arquitectura de carpetas

```
src/app/
├── core/                  # Singleton global: servicios, guards, interceptores, modelos
│   ├── services/
│   │   └── auth.service.ts        # login(), loadCurrentUser(), logout()
│   ├── guards/
│   │   └── auth.guard.ts          # canActivate: protege la zona privada
│   ├── interceptors/
│   │   └── auth.interceptor.ts    # ★ JWT via QueryString (?JWT=<token>)
│   ├── models/
│   │   ├── auth.models.ts         # LoginRequest, LoginResponse, UserProfile
│   │   └── dashboard.models.ts    # ApiUser, Household, Ticket, DashboardStats
│   └── store/
│       └── auth.store.ts          # Signals: authToken, currentUser, isAuthenticated
│                                  # Acciones: setAuth, setCurrentUser, clearAuth
│
├── features/              # Módulos funcionales, lazy-loaded
│   ├── auth/
│   │   └── login/                 # LoginComponent (pública)
│   ├── dashboard/
│   │   ├── dashboard.component.*  # KPIs + accesos rápidos
│   │   ├── dashboard.routes.ts    # Rutas lazy del feature
│   │   └── dashboard.service.ts   # forkJoin de /users, /households, /tickets
│   ├── users/             # stub — próximo sprint
│   ├── households/        # stub — próximo sprint
│   ├── fridges/           # stub — próximo sprint
│   └── tickets/           # stub — próximo sprint
│
├── shared/                # Reutilizables sin estado de negocio
│   └── components/
│       ├── kpi-card/      # ★ KpiCardComponent — stats card reutilizable
│       ├── modal/         # ModalComponent + ModalService (glassmorphism)
│       └── button/        # app-button con variants (pendiente)
│
└── layout/                # Shell visual privado
    ├── sidebar/
    │   └── sidebar.component.*    # Drawer con nav items + collapse + logout
    └── main-layout/
        └── layout.component.*     # Topbar (avatar dropdown) + <router-outlet>
```

**Regla de dependencias (unidireccional):**
`layout → features → shared → core`. Nunca a la inversa.
`core` no importa nada de `features`; `shared` no conoce `features`.

---

## 3. Paleta de colores

Declarada en `src/styles/_variables.css`. Editar allí, nunca hardcodear hex en componentes.

| Token | Valor | Uso |
|---|---|---|
| `--color-primary-500` | `#22A55A` | Acciones principales, botones, links activos |
| `--color-primary-600` | `#188547` | Hover de primary |
| `--color-primary-800` | `#0A3F22` | Botones oscuros de alto contraste |
| `--color-primary-50`  | `#E9F8EE` | Fondos suaves, estados hover |
| `--color-accent-500`  | `#FF9A1F` | Highlights decorativos (badge, underline) |
| `--color-bg`          | `#F3F8F4` | Fondo general |
| `--color-surface`     | `#FFFFFF` | Cards, modales, sidebar |
| `--color-surface-2`   | `#F7F5EC` | Blobs decorativos crema |
| `--color-text`        | `#0E1B14` | Texto principal |
| `--color-text-muted`  | `#5B6B61` | Texto secundario |
| `--color-danger`      | `#E5484D` | Errores, logout |

**Radios:** `sm 10` · `md 14` · `lg 20` · `xl 28` · `pill 999`.
**Sombras:** todas con tinte verde (`rgba(15,94,50, α)`) para cohesión cromática.

---

## 4. Rutas

```ts
// app.routes.ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/layout.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',  loadChildren: () => import('./features/dashboard/dashboard.routes') },
      { path: 'users',      loadChildren: () => import('./features/users/users.routes') },
      { path: 'households', loadChildren: () => import('./features/households/households.routes') },
      { path: 'fridges',    loadChildren: () => import('./features/fridges/fridges.routes') },
      { path: 'tickets',    loadChildren: () => import('./features/tickets/tickets.routes') },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

Cada feature expone sus propias rutas — carga perezosa por defecto.

---

## 5. Flujo de sesión

1. `LoginComponent` llama a `AuthService.login()`.
2. El servicio hace `POST /auth/login` → obtiene el token.
3. Llama a `GET /users/me?JWT=<token>` (token pasado directamente, aún no en el store).
4. Si `role === 'ROLE_ADMIN'` → `setAuth(token, user)` → navega a `/dashboard`.
5. `authGuard` protege toda la zona `/`.
6. En cada refresco de página: `LayoutComponent.ngOnInit()` detecta token en store  
   pero `currentUser === null` → llama `AuthService.loadCurrentUser()` para hidratar el perfil.
7. `SidebarComponent` y el dropdown del topbar delegan el logout en `AuthService.logout()`,  
   que llama `clearAuth()` y navega a `/login`.

---

## 6. ★ Manejo de JWT — CRÍTICO

El token se envía como **header HTTP estándar**:

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### Implementación centralizada

**`core/interceptors/auth.interceptor.ts`** — interceptor funcional (Angular 15+):

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authToken();  // lee del Signal store (cargado desde localStorage)

  // Sin token o la request ya trae Authorization (login flow) → pasar sin tocar
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  return next(
    req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
  );
};
```

Registrado en `app.config.ts`:
```ts
provideHttpClient(withInterceptors([authInterceptor]))
```

### Caso especial: login flow

Durante el login, el token no está en el store cuando se llama a `/users/me`.
`AuthService.login()` inyecta el header manualmente con `HttpHeaders`:
```ts
this.http.get<UserProfile>(`${BASE_URL}/users/me`, {
  headers: new HttpHeaders({ Authorization: `Bearer ${res.token}` }),
})
```
El interceptor lo omite porque `req.headers.has('Authorization')` ya es `true`.

---

## 7. Componentes nuevos (este sprint)

### `app-kpi-card` — `shared/components/kpi-card/`

Tarjeta de métrica reutilizable. Inputs:

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | `string` | — (required) | Etiqueta de la métrica |
| `value` | `number\|string` | `0` | Valor mostrado en grande |
| `icon` | `'users'\|'home'\|'ticket'\|'grid'` | `'grid'` | Icono SVG inline |
| `color` | `'green'\|'orange'\|'blue'` | `'green'` | Variante de color del acento |
| `loading` | `boolean` | `false` | Muestra skeleton animado |
| `description` | `string` | — | Texto secundario opcional |

### `DashboardService` — `features/dashboard/`

- Signals: `isLoading`, `error`, `stats` (readonly), `hasData`.
- `loadStats()`: `forkJoin` de `/users`, `/households`, `/tickets` en paralelo.
- El interceptor añade `?JWT` automáticamente a las tres peticiones.

### `DashboardComponent` — `features/dashboard/`

- Llama `svc.loadStats()` en `ngOnInit`.
- Muestra 3 `<app-kpi-card>` en grid responsivo (3 col → 2 → 1).
- Sección de accesos rápidos (4 links a features).
- Banner de error con botón "Reintentar".

### `LayoutComponent` — `layout/main-layout/`

- Hydration del perfil: si hay token pero no `currentUser` → llama `loadCurrentUser()`.
- Topbar con `avatar-btn` (iniciales + nombre + chevron).
- Dropdown animado con info del usuario + badge de rol + botón logout.
- `@ViewChild(SidebarComponent)` para abrir el drawer desde el burger.

---

## 8. Sistema de modales

Único componente `<app-modal>` montado en el shell. Se invoca imperativamente:

```ts
const confirmed = await this.modal.open({
  title: 'Token generado',
  subtitle: 'Comparte este token con la otra persona',
  component: TokenPreviewComponent,
  data: { token },
  size: 'md',
});
```

- Overlay con `backdrop-filter: blur(8px)`.
- Card centrada, animación `pop-in` 420ms.
- Cierre por ESC, click en overlay o botones de acción (si `dismissible: true`).

---

## 9. Guía de estilos (UI)

- **Soft first:** bordes ≥ 14px, sombras con tinte verde, transiciones con `cubic-bezier(.22,1,.36,1)`.
- **Jerarquía por peso y color**, no por tamaños extremos. Títulos 22-28px, cuerpo 14-16px.
- **Espaciado:** múltiplos de 4. Padding de cards: 20-28px.
- **Estados interactivos obligatorios:** `:hover`, `:focus-visible`, `:active` (scale .98).
- **Accesibilidad:** contraste AA mínimo, `aria-label` en iconos, focus visible, ESC cierra modales.
- **Responsive:** breakpoints a **960px** (sidebar → drawer) y **480px** (acciones apiladas).

---

## 10. Checklist antes de mergear

- [ ] Sin colores hardcodeados (todo vía tokens).
- [ ] Signals para estado de UI; RxJS sólo para async real.
- [ ] Standalone components con `imports` explícitos.
- [ ] Feature lazy-loaded.
- [ ] JWT en QueryString — nunca en `Authorization` header.
- [ ] Responsive verificado en 360, 768 y 1280px.
- [ ] Foco de teclado navegable, ESC cierra overlays.
