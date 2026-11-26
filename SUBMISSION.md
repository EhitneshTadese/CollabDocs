# CollabDocs — Assessment Submission

## Project Overview

CollabDocs is a lightweight full-stack collaborative document editing application developed for the Ajaia LLC AI-Native Full Stack Product Engineer assessment.

## Project Links

- GitHub Repository: https://github.com/EhitneshTadese/CollabDocs
- Live Application: Pending deployment
- Walkthrough Video: Pending recording
- Google Drive Submission Folder: Pending

## Implemented Features

- Document creation and renaming.
- Rich-text document editing.
- Bold, italic, underline, headings, and lists.
- Undo and redo.
- Document saving and reopening.
- Persistent PostgreSQL storage.
- Plain-text file import.
- Document sharing between demo users.
- Owned and shared document separation.
- Backend ownership and access permission checks.
- Input validation and error feedback.

## Technology Stack

- React
- TypeScript
- Vite
- Tiptap
- Node.js
- Express
- PostgreSQL
- Neon
- Supertest
- Git and GitHub

## How to Evaluate the Application

1. Open the application.
2. Select Alice as the demo user.
3. Create a new document.
4. Rename the document and enter formatted content.
5. Save the document.
6. Share the document with Bob.
7. Switch to Bob using the demo user selector.
8. Open the document under Shared with Me.
9. Edit and save the shared document.
10. Switch back to Alice and reopen the document to verify the changes.
11. Import a .txt file to evaluate the file import functionality.

## Testing Results

- Automated tests: 10
- Passed: 10
- Failed: 0
- Frontend production build: Successful
- Core document workflows: Manually tested

## Documentation

- README.md — Project overview and setup instructions.
- ARCHITECTURE.md — System architecture and technical trade-offs.
- AI_WORKFLOW.md — AI assistance, implementation corrections, and verification.
- SUBMISSION.md — Assessment submission summary.

## Known Limitations

- Demo identities instead of production authentication.
- No simultaneous real-time editing.
- No automatic merging of concurrent edits.
- No document version history or commenting.
- File import limited to .txt files.
- Frontend bundle-size optimization remains a future improvement.

## AI-Assisted Development

ChatGPT was used extensively for planning, code generation, debugging, testing guidance, and documentation. AI-generated outputs were evaluated through local execution, manual testing, and automated API tests.

Additional details are provided in AI_WORKFLOW.md.