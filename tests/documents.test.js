const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server/index');
const { pool } = require('../server/db');

let documentId;

const content = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Automated test document' }
      ]
    }
  ]
};

after(async () => {
  try {
    if (documentId) {
      await pool.query(
        'DELETE FROM document_shares WHERE document_id = $1',
        [documentId]
      );

      await pool.query(
        'DELETE FROM documents WHERE id = $1',
        [documentId]
      );
    }
  } finally {
    await pool.end();
  }
});

test('Health endpoint responds successfully', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect(200);

  assert.equal(response.body.status, 'ok');
});

test('Document requests require a valid user', async () => {
  await request(app)
    .get('/api/documents')
    .expect(401);
});

test('Document creation, editing and sharing workflow', async (t) => {
  await t.test('Alice can create a document', async () => {
    const response = await request(app)
      .post('/api/documents')
      .set('x-user-id', '1')
      .send({
        title: 'Automated Test Document',
        content
      })
      .expect(201);

    documentId = response.body.id;

    assert.ok(documentId);
    assert.equal(response.body.owner_id, 1);
  });

  await t.test('Bob cannot open an unshared document', async () => {
    await request(app)
      .get(`/api/documents/${documentId}`)
      .set('x-user-id', '2')
      .expect(404);
  });

  await t.test('Alice can rename and save the document', async () => {
    await request(app)
      .put(`/api/documents/${documentId}`)
      .set('x-user-id', '1')
      .send({
        title: 'Updated Test Document',
        content
      })
      .expect(200);

    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set('x-user-id', '1')
      .expect(200);

    assert.equal(response.body.title, 'Updated Test Document');
    assert.deepEqual(response.body.content, content);
  });

  await t.test('Alice can share the document with Bob', async () => {
    await request(app)
      .post(`/api/documents/${documentId}/share`)
      .set('x-user-id', '1')
      .send({ email: 'bob@example.com' })
      .expect(200);
  });

  await t.test('Bob can access the shared document', async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set('x-user-id', '2')
      .expect(200);

    assert.equal(response.body.is_owner, false);
  });

  await t.test('Bob cannot share a document he does not own', async () => {
    await request(app)
      .post(`/api/documents/${documentId}/share`)
      .set('x-user-id', '2')
      .send({ email: 'alice@example.com' })
      .expect(403);
  });

  await t.test('Invalid document titles are rejected', async () => {
    await request(app)
      .post('/api/documents')
      .set('x-user-id', '1')
      .send({ title: '', content })
      .expect(400);
  });
});