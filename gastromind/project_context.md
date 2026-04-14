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
│   ├── services/          # AuthService, ApiService, etc.
│   ├── guards/            # authGuard, roleGuard
│   ├── interceptors/      # authInterceptor, errorInterceptor
│   └── models/            # User, Household, Fridge, Ticket (tipos compartidos)
│
├── features/              # Módulos funcionales, lazy-loaded
│   ├── dashboard/
│   ├── users/
│   ├── households/
│   ├── fridges/
│   └── tickets/
│
├── shared/                # Reutilizables sin estado de negocio
│   └── components/
│       ├── modal/         # ModalComponent + ModalService (glassmorphism)
│       ├── chart/         # Wrapper sobre la lib de charts elegida
│       ├── kpi-card/      # Tarjeta de métrica del dashboard
│       └── button/        # app-button con variants
│
└── layout/                # Shell visual privado
    ├── sidebar/
    ├── topbar/            # (opcional — hoy vive inline en main-layout)
    └── main-layout/
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
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/layout.component').then(m => m.LayoutComponent),
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

1. `LoginComponent` llama a `AuthService.login()` → guarda token (HttpOnly cookie o `signalStore`).
2. `authGuard` protege toda la zona `/` (layout principal).
3. `LayoutComponent` expone el `user()` signal; `SidebarComponent.logout()` delega en `AuthService.logout()`, que limpia estado y navega a `/login`.
4. `authInterceptor` añade el `Authorization` header y captura 401 → logout automático.

---

## 6. Guía de estilos (UI)

- **Soft first:** bordes ≥ 14px, sombras con tinte verde, transiciones con `cubic-bezier(.22,1,.36,1)`.
- **Jerarquía por peso y color**, no por tamaños extremos. Títulos 22-28px, cuerpo 14-16px.
- **Espaciado:** múltiplos de 4. Padding de cards: 20-28px.
- **Estados interactivos obligatorios:** `:hover`, `:focus-visible`, `:active` (scale .98).
- **Accesibilidad:** contraste AA mínimo, `aria-label` en iconos, focus visible, ESC cierra modales.
- **Responsive:** breakpoints a **960px** (sidebar → drawer) y **480px** (acciones apiladas).

---

## 7. Sistema de modales

Único componente `<app-modal>` montado en el shell. Se invoca imperativamente:

```ts
const confirmed = await this.modal.open({
  title: 'Token generado',
  subtitle: 'Comparte este token con la otra persona',
  component: TokenPreviewComponent, // opcional
  data: { token },
  size: 'md',
});
```

- Overlay con `backdrop-filter: blur(8px)`.
- Card centrada, animación `pop-in` 420ms.
- Cierre por ESC, click en overlay o botones de acción (si `dismissible: true`).

---

## 8. Checklist antes de mergear

- [ ] Sin colores hardcodeados (todo vía tokens).
- [ ] Signals para estado de UI; RxJS sólo para async real.
- [ ] Standalone components con `imports` explícitos.
- [ ] Feature lazy-loaded.
- [ ] Responsive verificado en 360, 768 y 1280px.
- [ ] Foco de teclado navegable, ESC cierra overlays.
