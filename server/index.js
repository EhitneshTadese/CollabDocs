require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { z } = require('zod');
const { pool, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const emptyDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
};

const documentSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.object({
    type: z.literal('doc'),
    content: z.array(z.unknown())
  }).passthrough()
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CollabDocs API is running'
  });
});

// List demo users
app.get('/api/users', async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email FROM users ORDER BY id'
  );
  res.json(result.rows);
});

// Validate the selected demo identity
app.use('/api/documents', async (req, res, next) => {
  const userId = Number(req.headers['x-user-id']);

  if (!Number.isSafeInteger(userId) || userId < 1) {
    return res.status(401).json({
      error: 'Select a valid demo user'
    });
  }

  const result = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  );

  if (!result.rowCount) {
    return res.status(401).json({
      error: 'User not found'
    });
  }

  req.userId = userId;
  next();
});

// List owned and shared documents
app.get('/api/documents', async (req, res) => {
  const result = await pool.query(`
    SELECT d.id, d.title, d.owner_id,
           d.updated_at, u.name AS owner_name,
           (d.owner_id = $1) AS is_owner
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = $1
       OR EXISTS (
         SELECT 1 FROM document_shares s
         WHERE s.document_id = d.id
           AND s.user_id = $1
       )
    ORDER BY d.updated_at DESC
  `, [req.userId]);

  res.json(result.rows);
});

// Create a document
app.post('/api/documents', async (req, res) => {
  const parsed = documentSchema.safeParse({
    title: req.body.title ?? 'Untitled Document',
    content: req.body.content ?? emptyDocument
  });

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid document title or content'
    });
  }

  const result = await pool.query(`
    INSERT INTO documents (owner_id, title, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [
    req.userId,
    parsed.data.title,
    JSON.stringify(parsed.data.content)
  ]);

  res.status(201).json(result.rows[0]);
});

// Validate document IDs
app.param('id', (req, res, next, value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({
      error: 'Invalid document ID'
    });
  }

  next();
});

// Open a document
app.get('/api/documents/:id', async (req, res) => {
  const result = await pool.query(`
    SELECT d.*, (d.owner_id = $2) AS is_owner
    FROM documents d
    WHERE d.id = $1
      AND (
        d.owner_id = $2 OR EXISTS (
          SELECT 1 FROM document_shares s
          WHERE s.document_id = d.id
            AND s.user_id = $2
        )
      )
  `, [req.params.id, req.userId]);

  if (!result.rowCount) {
    return res.status(404).json({
      error: 'Document not found or access denied'
    });
  }

  res.json(result.rows[0]);
});

// Rename and save a document
app.put('/api/documents/:id', async (req, res) => {
  const parsed = documentSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid document title or content'
    });
  }

  const result = await pool.query(`
    UPDATE documents d
    SET title = $1, content = $2, updated_at = NOW()
    WHERE d.id = $3
      AND (
        d.owner_id = $4 OR EXISTS (
          SELECT 1 FROM document_shares s
          WHERE s.document_id = d.id
            AND s.user_id = $4
        )
      )
    RETURNING d.*
  `, [
    parsed.data.title,
    JSON.stringify(parsed.data.content),
    req.params.id,
    req.userId
  ]);

  if (!result.rowCount) {
    return res.status(404).json({
      error: 'Document not found or access denied'
    });
  }

  res.json(result.rows[0]);
});

// Share a document (owner only)
app.post('/api/documents/:id/share', async (req, res) => {
  const parsed = z.object({
    email: z.string().trim().email()
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Enter a valid email address'
    });
  }

  const document = await pool.query(
    'SELECT owner_id FROM documents WHERE id = $1',
    [req.params.id]
  );

  if (!document.rowCount ||
      document.rows[0].owner_id !== req.userId) {
    return res.status(403).json({
      error: 'Only the document owner can share it'
    });
  }

  const user = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [parsed.data.email.toLowerCase()]
  );

  if (!user.rowCount) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  if (user.rows[0].id === req.userId) {
    return res.status(400).json({
      error: 'You already own this document'
    });
  }

  await pool.query(`
    INSERT INTO document_shares (document_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [req.params.id, user.rows[0].id]);

  res.json({ message: 'Document shared successfully' });
});

// Unknown API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Serve the frontend after production build
const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({
    error: err.status === 400
      ? 'Invalid request'
      : 'Something went wrong'
  });
});

// Initialize database and start server
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`CollabDocs API running on port ${PORT}`);
      });
    })
    .catch(() => {
      console.error('Database initialization failed');
      process.exit(1);
    });
}

module.exports = app;