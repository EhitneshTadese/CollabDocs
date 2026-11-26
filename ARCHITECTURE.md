# CollabDocs — Architecture Note

## 1. System Overview

CollabDocs is a lightweight full-stack collaborative document editing application inspired by Google Docs. It supports document creation, rich-text editing, persistent storage, text file import, and document sharing between demo users.

## 2. Technology Stack

- Frontend: React, TypeScript, and Vite
- Rich-text editor: Tiptap
- UI icons: Lucide React
- Backend: Node.js and Express
- Database: PostgreSQL hosted on Neon
- API testing: Supertest and Node.js test runner
- Version control: Git and GitHub
- Planned deployment: Render

## 3. System Architecture

The application follows a three-layer architecture:

```text
User / Browser
       |
React + TypeScript + Tiptap
       |
    REST API
       |
Node.js + Express
       |
PostgreSQL (Neon)
```

The frontend manages user interactions, document editing, formatting, and sharing controls. The backend processes API requests, validates inputs, and checks document access permissions. PostgreSQL provides persistent storage for documents, users, and sharing relationships.

## 4. Data Model

The application uses three main logical entities:

- Users: Represents the available demo users.
- Documents: Stores document titles, content, ownership, and associated metadata.
- Document sharing: Associates documents with users who have been granted access.

A document belongs to one owner and can be shared with other users.

## 5. Document Editing

Tiptap provides rich-text editing capabilities, including bold, italic, underline, headings, and lists.

An explicit Save button allows users to persist changes. Saved documents can be reopened and edited later.

## 6. Sharing and Access Control

The application uses predefined demo identities, including Alice and Bob.

The backend checks document ownership and sharing permissions. Owners can grant access to another user. Shared users can access and edit authorized documents but cannot share documents they do not own.

The demo identity selector simplifies evaluation but is not a production authentication mechanism.

## 7. File Import

Plain-text (.txt) files can be imported into the application as editable documents.

This format was selected to provide a straightforward file import workflow without introducing complex document conversion dependencies.

## 8. Architecture Decisions and Trade-offs

- React and TypeScript provide a structured frontend development environment.
- Tiptap reduces the complexity of implementing rich-text editing from scratch.
- PostgreSQL provides relational storage for ownership and sharing relationships.
- Explicit saving simplifies document persistence.
- A single-service deployment is intended to simplify hosting and maintenance.
- Demo identities reduce authentication complexity within the assessment time limit.

## 9. Testing and Validation

The application was manually tested for document creation, renaming, editing, sharing, and file import.

Automated API tests cover document operations, access restrictions, ownership permissions, and invalid document titles.

The local test run reported 10 passing tests and zero failures. The frontend production build also completed successfully.

## 10. Known Limitations

- No production authentication.
- No simultaneous real-time editing.
- No document version history.
- No commenting system.
- File import is limited to plain-text files.
- Concurrent editing conflicts are not automatically merged.

The frontend production build reports a bundle-size warning, which could be addressed through code splitting in a future iteration.

## 11. Future Improvements

Future development could include secure authentication, real-time collaboration, automatic saving, document version history, additional file formats, and improved performance optimization.