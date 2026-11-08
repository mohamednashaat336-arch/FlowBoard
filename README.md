# FlowBoard

FlowBoard is a responsive, frontend-only project and task management demo. It includes a dashboard, project and task management, Kanban, calendar, team overview, analytics, local notifications, and workspace settings.

All example names and emails are fictional. Projects, tasks, notifications, preferences, and theme selection are stored in the current browser. Login and registration are demo entry screens only; they do not create accounts or authenticate users.

## Features

- Project and task CRUD with shared project/task relationships.
- Dashboard metrics derived from the current workspace.
- Kanban drag and drop with task search and filters.
- Month, week, and upcoming task calendar views.
- Fictional team directory with task assignment and workload counts.
- Analytics charts based on actual workspace records; unavailable history is not fabricated.
- Persistent in-app notifications and configurable preferences.
- JSON workspace export/import with validation, plus a confirmed demo-data reset.
- Light and dark themes, responsive layouts, and direct-load SPA routes.

## Technology

- React 19 and JavaScript (ES modules)
- Vite 8
- React Router DOM
- Bootstrap 5 utilities with FlowBoard CSS variables and custom styles
- Lucide React icons
- Recharts
- dnd-kit
- Browser LocalStorage

No backend, hosted database, authentication provider, or application data API is used.

## Requirements

- Node.js compatible with the Vite version in `package.json`
- npm

## Install and run

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Scripts

```sh
npm run dev       # Start Vite development server
npm run lint      # Run Oxlint
npm run build     # Create the production build in dist/
npm run preview   # Preview the production build locally
```

## Project structure

```text
public/                 Static favicon and icons
src/components/         Shared UI, layout, dashboard, project, and task components
src/context/            Shared workspace and theme providers
src/data/               Fictional demo projects, tasks, and team members
src/hooks/              Context and LocalStorage hooks
src/pages/              Routed application pages
src/services/           Workspace normalization and import validation
src/styles/              Theme variables and application styles
src/utils/               Local date helpers
```

## Local data and privacy limits

Workspace records are saved under `flowboard-workspace-data`; the theme is saved under `flowboard-theme`. Browser storage is editable by the person using the browser and is not secure storage. Do not enter secrets, real passwords, or sensitive personal information. Exported JSON contains the current local workspace data and preferences; it does not contain authentication credentials.

Imported JSON is checked for valid project and task records and project references before the workspace is replaced. Resetting data restores the fictional sample workspace after confirmation. Clearing browser storage removes the locally saved changes.

The login and registration routes only collect temporary form input to enter the demo. They do not store the input or verify identity. Hiding routes or controls in the frontend does not provide authorization or protect data.

## Deploy to Vercel

1. Push this project to a Git provider and import the repository in Vercel, or install the Vercel CLI and run `vercel` from the project directory.
2. Use the Vite framework preset. Set the build command to `npm run build` and the output directory to `dist` (Vercel can detect these defaults).
3. Deploy a preview first. The included `vercel.json` rewrites direct route requests, such as `/projects` and `/analytics`, to the SPA entry point.
4. When the preview is ready, promote it through Vercel or run `vercel --prod` from the project directory.

Deployment does not add a backend. Each visitor has a separate browser-local demo workspace.

## Specification

See [FLOWBOARD_PROJECT_SPEC.md](./FLOWBOARD_PROJECT_SPEC.md) for the project blueprint, design tokens, scope, and development phases.
