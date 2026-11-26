# CollabDocs

## Project Overview

CollabDocs is a lightweight, full-stack collaborative document editing application developed for the Ajaia LLC AI-Native Full Stack Product Engineer assessment.

The application allows users to create, edit, format, save, import, and share documents through a simple web-based workspace.

## Features

- Create and rename documents.
- Edit documents using a rich text editor.
- Apply bold, italic, underline, headings, and list formatting.
- Save and reopen documents.
- Import plain text (.txt) files as editable documents.
- Share documents with another registered demo user.
- Separate owned documents from shared documents.
- Switch between demo users to demonstrate collaboration.
- Persist document content and sharing permissions in PostgreSQL.
- Validate requests and display error messages.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Rich Text Editor | Tiptap |
| Icons | Lucide React |
| Backend | Node.js, Express |
| Database | PostgreSQL hosted on Neon |
| Validation | Zod |
| Testing | Node.js Test Runner, Supertest |
| Version Control | Git and GitHub |

## Project Structure

- `client/` — React frontend and document editor.
- `server/` — Express API and database configuration.
- `tests/` — Automated API integration tests.
- `docs/` — Architecture and AI workflow documentation.

## Local Setup

### Prerequisites

- Node.js 22 or compatible version.
- npm.
- PostgreSQL database or Neon account.
- Git.

### Installation

Clone the repository:

```bash
git clone https://github.com/EhitneshTadese/CollabDocs.git
cd CollabDocs
```

Install dependencies:

```bash
npm ci
npm ci --prefix client
```

Create a `.env` file in the project root with the following configuration:

```env
DATABASE_URL=your_postgresql_connection_string
PORT=3001
```

Do not commit database credentials to version control.

### Run the Application

Build the frontend:

```bash
npm run build
```

Start the application:

```bash
npm start
```

Open http://localhost:3001 in your browser.

The server initializes the required database tables and demo users.

## Demo Workflow

1. Select Alice from the demo user dropdown.
2. Create a new document.
3. Rename the document and enter formatted content.
4. Save the document.
5. Share the document with Bob.
6. Switch to Bob and open the document under Shared with Me.
7. Edit and save the shared document.
8. Switch back to Alice and reopen the document to view the changes.

## Automated Testing

Run the automated integration tests with a configured database:

```bash
node --test tests/documents.test.js
```

Local test results:

- Tests reported: 10
- Passed: 10
- Failed: 0

The tests cover document creation, editing, sharing, access restrictions, and input validation.

## Design Decisions and Limitations

CollabDocs prioritizes a functional document editing and sharing workflow within the assessment time limit.

Demo identities are used instead of production authentication. Server-side ownership and sharing checks are implemented, but demo identity switching is not a secure authentication mechanism.

Collaboration is asynchronous. Users save and reopen documents to view changes. Real-time simultaneous editing, version history, comments, and advanced file formats are outside the current scope.

File import supports plain text files.

## Deployment

Public deployment: Pending verification.

## Source Code

https://github.com/EhitneshTadese/CollabDocs
