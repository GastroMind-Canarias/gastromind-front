# Gastromind — Administration Panel

> Complete user manual · English version  
> [Versión en español → README.md](./README.md)

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Logging in](#2-logging-in)
3. [General interface structure](#3-general-interface-structure)
4. [Dashboard — Home](#4-dashboard--home)
5. [Users](#5-users)
6. [Households](#6-households)
7. [Fridges](#7-fridges)
8. [Purchase tickets](#8-purchase-tickets)
9. [Usual purchases](#9-usual-purchases)
10. [Favorites](#10-favorites)
11. [Products](#11-products)
12. [Categories](#12-categories)
13. [Stores](#13-stores)
14. [Units](#14-units)
15. [Server metrics](#15-server-metrics)
16. [Common UI elements](#16-common-ui-elements)

---

## 1. Introduction

**Gastromind** is a web-based administration panel designed to centrally manage all resources in the Gastromind ecosystem: users, households, smart fridges, products, purchase tickets, favourite recipes, and server metrics.

The application is intended exclusively for administrators (`ROLE_ADMIN`). If the authenticated user does not have this role, access will be denied and the system will redirect to the login page.

### Requirements

- A user account with the `ROLE_ADMIN` role.
- A modern browser (up-to-date Chrome, Firefox, Edge, or Safari).
- A network connection to the Gastromind backend server.

---

## 2. Logging in

### Route: `/login`

When you open the application for the first time, or after logging out, the system automatically redirects to the login page.

### Form fields

| Field | Description |
|---|---|
| **Email address** | The administrator account's email. |
| **Password** | The account's password. |

### Authentication flow

1. Enter your email and password and click **Sign in**.
2. The system sends the credentials to the server and receives a JWT token in return.
3. It then verifies that the account has the `ROLE_ADMIN` role. If it does not, access is blocked and an error message is displayed.
4. If authentication succeeds, the token is saved in the browser and you are redirected to the **Dashboard**.

### Session persistence

The session token is stored locally in the browser. This means that when you reload the page, you do not need to log in again — the application automatically retrieves the token and restores the session.

### Logging out

To log out, click the **Log out** button at the bottom of the left sidebar. The token is removed from the browser and the system redirects to the login page.

---

## 3. General interface structure

Once authenticated, the application presents a two-column layout:

```
┌──────────────────┬───────────────────────────────────────┐
│     Sidebar      │                                       │
│                  │          Content area                 │
│  · Dashboard     │                                       │
│  · Users         │  (Active page based on current route) │
│  · Households    │                                       │
│  · Fridges       │                                       │
│  · Tickets       │                                       │
│  · Usual purch.  │                                       │
│  · Favorites     │                                       │
│  · Products      │                                       │
│  · Categories    │                                       │
│  · Stores        │                                       │
│  · Units         │                                       │
│  · Metrics       │                                       │
│  ─────────────── │                                       │
│  · Log out       │                                       │
└──────────────────┴───────────────────────────────────────┘
```

### Sidebar

- The **active item** is highlighted with the primary colour.
- On small screens the sidebar collapses to maximise the content area.
- The logged-in administrator's name and avatar are displayed at the bottom.

### Content area

Each page follows the same internal structure:

1. **Header** — section title and subtitle showing the record count.
2. **Toolbar** — search field, filters, and the primary action button.
3. **Table or list** of records.
4. **Modals** for creating and editing records (opened on top of the content without leaving the page).

---

## 4. Dashboard — Home

### Route: `/dashboard`

The Dashboard is the home page and provides a high-level overview of the entire system.

### KPI cards (key performance indicators)

At the top, **8 cards** display the current count of each main entity:

| Card | Colour | What it measures |
|---|---|---|
| Users | Green | Total registered users in the system |
| Households | Orange | Total households created |
| Fridges | Blue | Total registered fridges |
| Tickets | Purple | Total purchase tickets |
| Categories | Pink | Total product categories |
| Recipes | Yellow | Total recipes saved as favourites |
| Stores | Indigo | Total registered stores |
| Products | Cyan | Total products in the catalogue |

Each card shows a representative icon, the entity name, the current count, and a coloured accent bar on the left edge.

### Loading state

While data is being fetched from the server, the cards display an animated **skeleton loader** with a shimmer effect. Once data arrives, the counters update automatically.

### Quick access

Below the KPI cards there is a grid of **quick-access cards** linking to the most frequently used sections. Each card shows the section name and icon; clicking it navigates directly to that section.

---

## 5. Users

### Route: `/users`

This section lets you manage all user accounts in the system.

### User list

The table displays the following columns:

| Column | Description |
|---|---|
| **User** | Avatar with initials + full name + email |
| **Role** | Colour-coded badge showing the assigned role |
| **Household** | Name of the household the user belongs to |
| **Actions** | Edit and delete buttons |

#### Role badges

| Role | Badge colour |
|---|---|
| `Admin` | Green |
| `Owner` | Orange |
| `Member`, `Premium Member`, `Tests` | Neutral grey |

### Search and sorting

- **Real-time search**: type in the search field to filter users by name or email. The filter applies as you type.
- **Sorting**: click the sort button (up/down arrow next to the search field) to toggle between ascending and descending order by name.

### Creating a user

1. Click **New user** (top-right corner).
2. Fill in the modal form:
   - **Full name** — the user's display name.
   - **Email** — email address (must be unique).
   - **Password** — initial password.
   - **Role** — choose from: `Admin`, `Owner`, `Member`, `Premium Member`, `Tests`.
3. Click **Create user**. If an error occurs, a toast notification appears in the corner of the screen.

### Viewing user detail

Click any row in the table to open the user detail page (`/users/:id`).

The detail page shows:
- Complete profile data (name, email, role, assigned household).
- A form to **change the user's role** without editing other fields.
- A **danger zone** with the button to delete the user.

### Changing the role

On the detail page, select the new role from the dropdown and click **Save role**. The change takes effect immediately.

### Deleting a user

Whether from the table (trash icon) or from the detail page, the system shows a **confirmation dialog** before deleting. The dialog displays the user's email and requires explicit confirmation.

> **Warning:** Deletion is permanent and cannot be undone.

---

## 6. Households

### Route: `/households`

A **household** is the central organisational unit in Gastromind. It groups together users (members), available appliances, and fridges. This section lets you manage all households in the system.

### Household list

Each table row shows:

| Column | Description |
|---|---|
| **Household** | Household name with an identifying icon |
| **Members** | Number of members and their avatar thumbnails |
| **Appliances** | Badges listing the registered appliances |
| **Actions** | Detail access and delete buttons |

### Search and sorting

- **Search**: filter by household name or by any member's name.
- **Sorting**: toggle between A→Z and Z→A by household name.

### Creating a household

1. Click **New household**.
2. Enter the household name in the modal.
3. Click **Create household**.

### Household detail page

Click any household to open its detail page (`/households/:id`). From here you can:

#### Edit the name

Click the **Edit** button in the card header to open the edit modal. Change the name and click **Save changes**.

#### Managing appliances

The **Appliances** section shows all appliances currently registered in the household. Available appliances are:

| Appliance | Description |
|---|---|
| Oven | Conventional oven |
| Microwave | Microwave |
| Air Fryer | Air fryer |
| Hob | Ceramic hob / induction hob |
| Food processor | Multi-function food processor / robot cooker |
| Blender | Blender / liquidiser |
| Pressure cooker | Pressure cooker |

To **add an appliance**, select it from the dropdown and click **Add**. Only appliances the household does not yet have appear in the dropdown.

> Appliances cannot be removed once added from this panel.

#### Managing members

The **Members** section lists all household users with their name, email, and role.

- **Invite a member**: click **Generate invitation token** to obtain a unique code. Copy it with the button that appears next to the token and share it with the user you want to invite. The token has a limited validity period.
- **Promote to Owner**: for members with a lower role, the crown button promotes them to the `Owner` role within the household.
- **Remove a member**: the exit button (door icon) removes the member from the household after confirmation.

#### Delete household

In the **danger zone** at the bottom of the detail page, the **Delete household** button permanently removes the household and all its associated data after confirmation.

---

## 7. Fridges

### Route: `/fridges`

Fridges are the physical food containers linked to a household. This section lets you manage all fridges in the system and the food items they contain.

### Fridge list

| Column | Description |
|---|---|
| **Fridge** | Icon + abbreviated identifier (first 8 characters of the ID) |
| **Assigned household** | Name of the household the fridge belongs to |
| **Full ID** | Full UUID of the fridge in monospace format |
| **Actions** | Edit and delete buttons |

### Search and filtering

- **Search**: type to filter by household name or fridge ID. The filter is instant.
- **Household filter**: use the dropdown to show only the fridges of a specific household.
- **Clear filters**: when filters are active, the **Clear** button removes them all at once.

The header subtitle dynamically shows how many fridges are displayed out of the total (for example, *3 of 12 fridges*).

### Creating a fridge

1. Click **New fridge**.
2. Select the household the fridge will be assigned to from the dropdown.
3. Click **Create fridge**.

### Editing a fridge

Click the pencil icon on the fridge row to open the edit modal. Change the assigned household and save.

### Deleting a fridge

Click the trash icon. A confirmation dialog will warn that the fridge and **all its items** will be permanently deleted.

### Fridge detail page

Click any row to open the detail page (`/fridges/:id`).

#### Household information

The top card shows the fridge's full ID and the name of its assigned household. The **Edit** button lets you reassign the fridge to a different household.

#### Fridge items

The items table shows:

| Column | Description |
|---|---|
| **Product** | Product name |
| **Quantity** | Amount stored |
| **Expiry** | Expiry date (if specified) |
| **Status** | Colour-coded badge showing the item's status |

#### Item statuses

| Status | Colour | Meaning |
|---|---|---|
| `Good` | Green | The food is in good condition |
| `Expiring` | Orange | The food is close to its expiry date |
| `Consumed` | Grey | The food has been consumed |
| `Expired` | Red | The food has expired |

#### Item filters

Above the table there are three filters:

| Filter | Description |
|---|---|
| **All** | Shows all items in the fridge |
| **Expiring** | Shows only items close to their expiry date |
| **By category** | Dropdown to filter by product category; click **Filter** to apply |

#### Adding an item

1. Click **Add item**.
2. Fill in the form:
   - **Product** — select the product from the catalogue dropdown.
   - **Quantity** — enter the numeric quantity.
   - **Expiry date** — optional; use the date picker.
   - **Status** — choose the item's initial status.
3. Click **Add item**.

#### Actions on each item

| Action | Icon | Description |
|---|---|---|
| Edit | Pencil | Modify the item's data |
| Mark as consumed | Check | Sets the item status to `CONSUMED` directly |
| Consume quantity | Cup | Opens a modal to reduce the quantity by a specific amount |
| Delete | Trash | Removes the item after confirmation |

---

## 8. Purchase tickets

### Route: `/tickets`

Tickets record purchases made by users. Each ticket corresponds to a purchase receipt with its product lines.

### Ticket list

| Column | Description |
|---|---|
| **Ticket** | Abbreviated identifier + purchase date |
| **User** | Name of the user who made the purchase |
| **Store** | Store name |
| **Total** | Total purchase amount |
| **Actions** | View detail and delete |

### Search and sorting

- **Search**: filter by user name, store name, or ticket ID.
- **Sorting**: toggle between newest first and oldest first.

### Creating a ticket

1. Click **New ticket**.
2. Fill in the ticket header:
   - **User** — select the purchasing user from the dropdown.
   - **Store** — select the store from the dropdown.
   - **Purchase date** — select the date using the date picker.
   - **Total** — total purchase amount.
3. Add **product lines** by clicking **Add line**:
   - **Product** — select the product from the catalogue; the name is filled in automatically.
   - **Line name** — product name as it appears on the receipt (editable).
   - **Quantity** — number of units.
   - **Unit price** — price per unit.
   - **Unit** — select the unit of measure from the dropdown.
   - **Verification status** — `OK`, `PENDING`, or `MISMATCH`.
   - **Note** — optional note for that line.
   - The trash button removes that line from the form.
4. Click **Create ticket**.

### Viewing ticket detail

Click any row to open the detail page (`/tickets/:id`). It shows all ticket fields and each product line with its price, quantity, and verification status.

### Deleting a ticket

From the table or the detail page, click the trash icon. Confirmation is required before deletion.

---

## 9. Usual purchases

### Route: `/usual-purchases`

Usual purchases record the products that a user buys regularly or repeatedly.

### List

| Column | Description |
|---|---|
| **Product** | Name of the usual product |
| **User** | Name of the user who owns the usual purchase |
| **Actions** | Edit, view detail, and delete |

### Search and sorting

- **Search**: filter by user name or product name.
- **Sorting**: toggle between newest and oldest.

### Creating a usual purchase

1. Click **New usual purchase**.
2. Select the **user** from the dropdown.
3. Select the **product** from the dropdown.
4. Click **Create**.

### Viewing and editing detail

Click a row or the pencil icon to open the detail page (`/usual-purchases/:id`). From there you can modify the assigned user or product.

### Deleting

Click the trash icon and confirm in the dialog.

---

## 10. Favorites

### Route: `/user-favorites`

This section manages users' favourite recipes. Each favourite links a user to a complete recipe (title, instructions, time, required appliance, difficulty).

### Favorites list

| Column | Description |
|---|---|
| **Recipe** | Recipe title + required appliance |
| **User** | Name of the user who owns the favourite |
| **Difficulty** | Difficulty badge |
| **Time** | Preparation time in minutes |
| **Actions** | Edit, view detail, and delete |

### Search and sorting

- **Search**: filter by recipe title, user name, appliance, or difficulty.
- **Sorting**: toggle between A→Z and Z→A by recipe title.

### Creating a favourite

1. Click **New favourite**.
2. Select the **owner user** from the dropdown.
3. Fill in the recipe data:
   - **Title** — name of the recipe.
   - **Instructions** — detailed preparation steps.
   - **Servings** — number of portions.
   - **Preparation time** — in minutes.
   - **Required appliance** — select the appliance needed.
   - **Difficulty** — `Easy`, `Medium`, or `Hard`.
4. Click **Create favourite**.

> Internally, the system first creates the recipe and then links it to the user in two API calls.

### Difficulty levels

| Value | Description |
|---|---|
| `EASY` / Easy | Simple recipe with no complex techniques |
| `MEDIUM` / Medium | Requires some cooking experience |
| `HARD` / Hard | Advanced recipe with demanding techniques or timing |

### Viewing and editing detail

The detail page (`/user-favorites/:id`) shows the full recipe and allows editing all its fields or changing the owner user.

### Deleting a favourite

From the table or the detail page, the delete button shows a confirmation dialog before removing the record.

---

## 11. Products

### Route: `/products`

The product catalogue is the reference base used in fridges, tickets, and usual purchases.

### Product list

| Column | Description |
|---|---|
| **Product** | Product name |
| **Essential** | Indicates whether the product is essential |
| **Review** | Badge if the product needs review |
| **Allergen** | Associated allergen ID (if any) |
| **Actions** | Edit and delete |

### Creating a product

1. Click **New product**.
2. Fill in the fields:
   - **Name** — product name.
   - **Is essential** — tick if the product is a staple item.
   - **Needs review** — tick if the product must be reviewed by an administrator.
   - **Review note** — free-text field explaining why it needs review.
   - **Allergen** — allergen ID if applicable.
3. Click **Create product**.

### Editing and deleting

Use the action icons in the row. Deletion requires confirmation.

---

## 12. Categories

### Route: `/categories`

Categories organise products into thematic groups (dairy, fruit, vegetables, etc.) and are used as filters in fridges.

### Category list

Shows the name of each category and edit/delete buttons.

### Creating a category

1. Click **New category**.
2. Enter the category name.
3. Click **Create category**.

### Editing and deleting

The action buttons on each row let you rename the category or delete it. Deletion requires confirmation.

---

## 13. Stores

### Route: `/stores`

Stores are the shops where the purchases recorded in tickets take place.

### Store list

Shows the name of each store and edit/delete buttons.

### Creating a store

1. Click **New store**.
2. Enter the store name.
3. Click **Create store**.

### Editing and deleting

Use the action icons in each row. Deletion shows a confirmation dialog.

---

## 14. Units

### Route: `/units`

Units of measure are assigned to product lines in tickets (kilograms, litres, units, grams, etc.).

### Unit list

Shows the name of each unit and edit/delete buttons.

### Creating a unit

1. Click **New unit**.
2. Enter the unit name (for example: `kg`, `L`, `unit`, `g`).
3. Click **Create unit**.

### Editing and deleting

Use the action icons. Deletion requires confirmation.

---

## 15. Server metrics

### Route: `/metrics`

This section displays real-time charts with backend server metrics fetched from **Prometheus**. It is designed to monitor the health of the system.

### Refresh button

The **Refresh** button in the top-right corner reloads all chart data. While loading, the button shows a spinner and is disabled.

### Chart 1 — HTTP traffic by status code

**Type:** Time-series line · **Unit:** requests per second (req/s)

Shows the rate of HTTP requests received by the server over the last **2 hours**, grouped by response code:

| Colour | Code | Meaning |
|---|---|---|
| Green | 2xx | Successful responses |
| Blue | 3xx | Redirections |
| Amber | 4xx | Client errors |
| Red | 5xx | Server errors |

**How to read it:** A sustained increase in 5xx errors indicates server-side problems. A spike in 4xx errors may point to malformed requests or authentication issues.

### Chart 2 — JVM Heap memory

**Type:** Doughnut · **Unit:** megabytes (MB) · **Badge:** Live (real-time)

Shows the current state of the JVM heap memory, split into:
- **Used** (red): heap memory currently in use.
- **Free** (grey): available heap memory.

Below the chart, exact values are shown in MB:
- **Used** — MB currently in use.
- **Free** — MB available (Total − Used).
- **Total heap** — configured maximum heap limit.

**How to read it:** If used memory exceeds **85 %** of the total for a sustained period, there is a risk of an `OutOfMemoryError`.

### Chart 3 — CPU usage

**Type:** Time-series line · **Unit:** percentage (%)

Shows the percentage of CPU consumed by the JVM process over the last **2 hours**.

**How to read it:** Occasional spikes are normal. If usage stays above **80 %** continuously, it may indicate bottlenecks or slow database queries.

### Chart 4 — Average HTTP latency

**Type:** Time-series line · **Unit:** milliseconds (ms)

Shows the average response time across all API endpoints over the last **2 hours**.

**How to read it:**
- Below **200 ms**: optimal performance.
- Between 200 ms and 1 000 ms: attention zone.
- Above **1 000 ms**: service degradation — check logs and database performance.

---

## 16. Common UI elements

### Toast notifications

When an action completes (create, edit, delete, error…), a small notification appears in the corner of the screen and disappears automatically after **5 seconds**. Colours indicate the type:

| Colour | Type |
|---|---|
| Green | Success |
| Red | Error |
| Blue | Info |
| Yellow | Warning |

### Confirmation dialog

Before any destructive action (deleting a record), the system shows a **two-step confirmation modal**:
1. The action title and a descriptive message including the affected entity's name are displayed.
2. You must click the red confirm button to proceed. The **Cancel** button closes the dialog without doing anything.

### Loading skeletons

While data is loading from the server, tables and cards show animated grey placeholder rows (skeletons). This indicates that loading is in progress and avoids a content flash.

### Empty states

When a section has no records (or filters return no results), a representative icon is shown with an explanatory message and, in most cases, a direct button to create the first record or clear the filters.

### Responsive design

The interface adapts to different screen sizes:
- On tablets (< 960 px), some secondary table columns are automatically hidden to maintain readability.
- On mobile (< 480 px), the sidebar collapses and the content occupies the full width.

---

*Gastromind Admin Panel — Internal documentation*
