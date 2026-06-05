# ProjectHub — Internal Project Manager

A Single Page Application (SPA) for managing internal software projects with role-based access control, session persistence, and a simulated REST API via json-server.

---

## Description

ProjectHub is an internal tool for software companies to organize and track their projects. It implements two user roles with different permissions, full CRUD operations on projects, real-time search and filtering, pagination, toast notifications, dark mode, and session persistence via localStorage.

---

## Technologies

| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| Vite             | Module bundler and dev server                |
| Vanilla JS (ES6+)| Application logic (no frameworks)            |
| json-server      | Simulated REST API (GET, POST, PATCH, DELETE)|
| CSS Custom Props | Theming, dark mode, design tokens            |
| localStorage     | Session persistence across page reloads      |
| Fetch API        | HTTP requests to json-server                 |
| ES Modules       | Modular file structure with import/export    |

---

## Installation

Make sure you have **Node.js v18+** installed.

```bash
# 1. Clone the repository
git clone <repo-url>
cd project-manager

# 2. Install dependencies
npm install
```

---

## Running the Project

You need to run **two servers simultaneously**: the Vite dev server and json-server.

### Option A — Run both at once (recommended)

```bash
npm start
```

This command uses `concurrently` to start both servers simultaneously.

### Option B — Run them separately

Open two terminal windows:

```bash
# Terminal 1 — JSON Server (API)
npm run server

# Terminal 2 — Vite Dev Server (Frontend)
npm run dev
```

Then open your browser at: **http://localhost:5173**

---

## Running JSON Server

```bash
npm run server
```

The API will be available at `http://localhost:3000` with the following endpoints:

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | /users            | Get all users            |
| GET    | /users?email=...  | Filter users by email    |
| GET    | /projects         | Get all projects         |
| GET    | /projects/:id     | Get a specific project   |
| POST   | /projects         | Create a new project     |
| PATCH  | /projects/:id     | Partially update project |
| DELETE | /projects/:id     | Delete a project         |

---

## Test Users

These users are pre-loaded in `db.json`. There is no registration — credentials are fixed.

| Role         | Email              | Password | Permissions                          |
|--------------|--------------------|----------|--------------------------------------|
| Manager      | manager@test.com   | 123456   | Full CRUD on all projects            |
| Collaborator | user@test.com      | 123456   | View & update status of own projects |
| Collaborator | luis@test.com      | 123456   | View & update status of own projects |

---

## Project Structure

```
project-manager/
├── db.json                        # json-server database
├── package.json                   # Scripts and dependencies
├── vite.config.js                 # Vite configuration
├── index.html                     # Single HTML entry point
└── src/
    ├── main.js                    # App bootstrap (theme + router)
    ├── router.js                  # Hash-based SPA router
    ├── styles/
    │   └── global.css             # Global styles and CSS variables
    ├── api/
    │   ├── auth.js                # Login logic against json-server
    │   └── projects.js            # CRUD functions (GET, POST, PATCH, DELETE)
    ├── services/
    │   └── session.js             # localStorage session management
    ├── views/
    │   ├── login.js               # Login page with validation
    │   ├── dashboard.js           # Role-based stats dashboard
    │   ├── projects.js            # Project list with search, filter, pagination
    │   ├── projectForm.js         # Create / Edit project form
    │   └── projectDetail.js       # Project detail view
    ├── components/
    │   ├── navbar.js              # Sidebar + topbar + dark mode toggle
    │   ├── toast.js               # Toast notification system
    │   └── loader.js              # Loading spinner and empty states
    └── utils/
        └── permissions.js         # Role-based permission helpers
```

---

## Role Permissions

### MANAGER

| Action                  | Allowed |
|-------------------------|---------|
| View all projects       | ✅      |
| Create projects         | ✅      |
| Edit any project        | ✅      |
| Delete any project      | ✅      |
| View project details    | ✅      |
| Access admin views      | ✅      |

### COLLABORATOR

| Action                            | Allowed |
|-----------------------------------|---------|
| View assigned projects            | ✅      |
| View project details              | ✅      |
| Update status of own projects     | ✅      |
| Create projects                   | ❌      |
| Delete projects                   | ❌      |
| Edit other users' projects        | ❌      |
| Access admin views                | ❌      |

---

## Technical Decisions

### 1. Hash-based routing (no library)

The SPA uses `window.location.hash` for navigation (e.g. `#/dashboard`, `#/projects/1/edit`). The `hashchange` event is listened globally in `router.js` and triggers a re-render of the active view. This approach requires zero configuration — no server-side routing rules needed, which is ideal for a Vite + json-server setup.

### 2. Session persistence via localStorage

User data (id, name, email, role) is stored as a JSON string in `localStorage` under the key `pm_session`. This persists across browser restarts. On every route change, the router reads this value to verify authentication and extract the current user's role.

### 3. Simulated authentication

json-server has no built-in authentication. We simulate it by: (1) fetching `/users?email=<input>` to find the user, (2) comparing the password manually client-side. In production, this would be done server-side with password hashing.

### 4. PATCH over PUT

We use `PATCH` for updates instead of `PUT`. `PATCH` sends only the changed fields, while `PUT` replaces the entire object. For collaborators who can only update the `status` field, `PATCH` is safer and more semantically correct.

### 5. Permission centralization

All role logic is isolated in `src/utils/permissions.js`. Views import `canCreate()`, `canDelete()`, `canEdit(project)` from there. This prevents duplicate logic across views and makes permission changes easy to manage in one place.

### 6. Parallel API calls with Promise.all

When a view needs multiple pieces of data (e.g. a project and all users), we fetch them simultaneously with `Promise.all([...])`. This cuts load time roughly in half compared to sequential `await` calls.

### 7. Dark mode with CSS variables

Dark mode is implemented entirely with CSS custom properties. A class `dark` on the `<html>` element switches all variables to their dark variants. The preference is stored in `localStorage` under `pm_theme` and applied before the first render to prevent flash of wrong theme.

---

## Extra Features Implemented

- ✅ Dark Mode (toggle in sidebar, persisted in localStorage)
- ✅ Real-time search (by name and description)
- ✅ Status filtering
- ✅ Pagination (6 projects per page)
- ✅ Toast notifications (success, error, info, warning)
- ✅ Loading spinners
- ✅ Empty state messages
- ✅ Responsive design (mobile sidebar)
- ✅ Advanced form validation with inline field errors
