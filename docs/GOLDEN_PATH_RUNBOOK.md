# NoorStudio Golden Path Runbook (Demo / Local)

Goal: demonstrate the end-to-end user journey aligned to **SCOPE.md** and **architecture.md**:

**create project → run pipeline stage(s) → export stub**

This runbook is intentionally written to work **without paid AI keys** (default `mock` providers). It exercises the same pipeline wiring, artifacts, and export package generation used by the app.

---

## 0) Prereqs

- Node.js installed (repo uses modern tooling; Node 18+ recommended)
- npm

> Notes from architecture.md
> - Frontend: React + Vite
> - Backend: Express (proxy layer)
> - AI stages: outline/chapters/humanize/illustrations/cover/layout/export

---

## 1) Install and configure

From the repo root:

```bash
cd 03_REPOS/Noorstudio

# install deps
npm install

# (optional but recommended) create a local env file for Vite
cp .env.example .env
```

### Expected output

- `npm install` completes without errors.
- You should see `node_modules/` created.

### Failure points to watch

- **Node too old**: install fails or Vite won’t run.
- **Lockfile mismatch**: if you switch package managers, stick with npm for this runbook.

---

## 2) Start the app

```bash
npm run dev
```

This runs:
- Vite dev server (frontend)
- Express dev server (`tsx watch server/index.ts`)

### Expected output

You should see something like:

- Vite:
  - `Local: http://localhost:5173/` (port may vary)
- Server:
  - `Server listening on http://localhost:3001` (default from `server/env.ts`)

### Failure points to watch

- **Port already in use** (common on 5173/3001)
  - Fix: stop the conflicting process, or set `PORT` in `server/.env`.
- **Env validation fails**
  - If you set `AI_TEXT_PROVIDER=claude` or `AI_IMAGE_PROVIDER=nanobanana` in `server/.env` without keys, `server/env.ts` will exit.

---

## 3) Create a new project (UI)

1. Open the app in your browser:
   - `http://localhost:5173/`
2. Navigate to:
   - **Books → Create New Book** (route is typically `/app/books/new`)
3. Fill minimal required fields:
   - Title
   - Age range
   - Template type
   - Synopsis / learning objective
   - Select at least **1 locked character** (required for export readiness)
4. Click **Create** (or equivalent).

### Expected output

- You land on the project workspace (route like `/app/projects/:id`).
- The left side shows **Pipeline Stages** with statuses.
- A project record is persisted to localStorage under:
  - `noorstudio.projects.v1` (namespaced)

### Failure points to watch

- If you can’t proceed due to missing characters/KB selection, use the **default** Universe/KB.
- If the app shows “Project Not Found” after creation, localStorage may be blocked or cleared.

---

## 4) Run pipeline stages (minimum set)

The true MVP pipeline per SCOPE.md is:

`Outline → Chapters → Humanize → Illustrations → Cover → Layout → Export`

For the *golden path demo*, the minimum recommended sequence is:

1) **Outline**
2) **Chapters**
3) **Illustrations** (optional for demo; layout can run with empty illustrations, but best to include)
4) **Layout**
5) **Cover** (export readiness requires `cover` completed due to pipeline dependency)
6) **Export** (currently implemented as a **stub/demo export** in the UI)

### 4.1 Run Outline

In the project workspace, click **Run** on “Outline”.

Expected:
- Stage progresses to `running` then `completed`
- Artifact stored at `project.artifacts.outline`
- In mock mode, the outline is deterministic-ish JSON

Failure points:
- **JSON parse errors**: the UI will show a recovery banner (retry parse / show raw output).

### 4.2 Run Chapters

Click **Run** on “Chapters”.

Expected:
- Uses the structured outline stored under `outline.content._structured`
- Artifact stored at `project.artifacts.chapters` as a list of chapter objects

Failure points:
- “Outline must be generated first” if outline missing.

### 4.3 Run Illustrations (optional but recommended)

Click **Run** on “Illustrations”.

Expected:
- Generates per-chapter illustrations with 3 variants each (in real provider mode)
- In mock mode, still runs and creates artifacts depending on provider wiring

Failure points:
- Image provider errors will be logged; variant generation continues best-effort.

### 4.4 Run Layout

Click **Run** on “Layout”.

Expected:
- Layout artifact created (`pageCount`, `spreads[]`, `settings`, `generatedAt`)

Failure points:
- “Chapters must be generated first” if chapters are missing.

### 4.5 Run Cover

Click **Run** on “Cover”.

Expected:
- Cover artifact created with `frontCoverUrl` and `backCoverUrl`

Failure points:
- If image provider is real and keys missing, it fails; stay in `mock` for this runbook.

---

## 5) Export stub (UI)

Click **Run** on “Export”.

What happens today:
- The **UI uses a mock job runner** for export.
- It generates an **Export Package v1** (a structured list of files + previews) and saves it to the project:
  - `project.exportPackage`
  - `project.exportHistory[]`
- It also stores an `export` artifact with demo file entries (`/exports/:id.pdf`, `/exports/:id.epub`).

### Expected output

- Export stage becomes `completed`.
- “Export” tab shows file entries (format, URL, file size).
- “Export Package” (package icon / export section) shows:
  - coverFront/coverBack preview URLs
  - interior preview pages
  - manuscript + metadata + license placeholders

### Failure points to watch

- **Plan gating**: export is gated by entitlements (`canExport()`). If you see “Export Not Available”, set the app to a plan that allows export (Author/Studio) or adjust entitlements for local demo.
- **Readiness validation**: `validateExportReadiness(project)` blocks export if:
  - outline not completed
  - chapters not completed
  - no characterIds

---

## 6) Verification checklist (acceptance)

You have successfully completed the golden path if:

- You can see a project in Dashboard and open its workspace.
- Pipeline shows at least these completed: `outline`, `chapters`, `layout`, `cover`, `export`.
- In localStorage, the project contains:
  - `artifacts.outline`
  - `artifacts.chapters`
  - `artifacts.layout` (or equivalent)
  - `artifacts.cover`
  - `artifacts.export`
  - `exportPackage` and `exportHistory`

---

## Appendix: Useful developer commands

```bash
# run only the frontend
npm run dev:client

# run only the server
npm run server:dev

# lint + tests
npm run lint
npm test
```
