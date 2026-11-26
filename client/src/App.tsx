import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  FileText, Plus, Upload, Save, Share2,
  Bold, Italic, Underline, Heading1, Heading2,
  List, ListOrdered, Undo, Redo
} from 'lucide-react'
import { api } from './api'
import type { User, DocumentSummary, DocumentData } from './api'
import './App.css'

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserId] = useState(1)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [current, setCurrent] = useState<DocumentData | null>(null)
  const [title, setTitle] = useState('')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [shareEmail, setShareEmail] = useState('')
  const [showShare, setShowShare] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: () => setDirty(true),
  })

  useEffect(() => {
    api.getUsers().then(setUsers).catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    let active = true
    api.getDocuments(userId)
      .then(data => {
        if (active) setDocuments(data)
      })
      .catch(e => {
        if (active) setError(e.message)
      })
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function canLeave() {
    return !dirty || window.confirm('Discard unsaved changes?')
  }

  async function refreshDocuments() {
    setDocuments(await api.getDocuments(userId))
  }

  function loadDocument(doc: DocumentData) {
    setCurrent(doc)
    setTitle(doc.title)
    editor?.commands.setContent(doc.content, { emitUpdate: false })
    setDirty(false)
    setShowShare(false)
    setShareEmail('')
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function switchUser(id: number) {
    if (!canLeave()) return
    setUserId(id)
    setCurrent(null)
    setDocuments([])
    setTitle('')
    setDirty(false)
    setShowShare(false)
    setShareEmail('')
    setError('')
    setMessage('')
    editor?.commands.clearContent(false)
  }

  function createDocument() {
    if (!canLeave()) return
    void run(async () => {
      const doc = await api.createDocument(userId)
      loadDocument({ ...doc, is_owner: true })
      await refreshDocuments()
      setMessage('Document created')
    })
  }

  function openDocument(id: number) {
    if (!canLeave()) return
    void run(async () => {
      loadDocument(await api.getDocument(userId, id))
    })
  }

  function saveDocument() {
    if (!current || !editor) return
    if (!title.trim()) {
      setError('Document title cannot be empty')
      return
    }

    void run(async () => {
      const saved = await api.saveDocument(
        userId, current.id, title.trim(), editor.getJSON()
      )
      loadDocument({ ...saved, is_owner: current.is_owner })
      await refreshDocuments()
      setMessage('All changes saved')
    })
  }

  function importFile(file: File) {
    if (!canLeave()) return

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('Please select a .txt file')
      return
    }

    if (file.size > 100000) {
      setError('File must be smaller than 100 KB')
      return
    }

    void run(async () => {
      const text = await file.text()
      const content = {
        type: 'doc',
        content: text.split(/\r?\n/).map(line => ({
          type: 'paragraph',
          ...(line ? {
            content: [{ type: 'text', text: line }]
          } : {})
        }))
      }

      const doc = await api.createDocument(
        userId,
        file.name.replace(/\.txt$/i, '').slice(0, 255) || 'Imported document',
        content
      )

      loadDocument({ ...doc, is_owner: true })
      await refreshDocuments()
      setMessage('File imported successfully')
    })
  }

  function shareDocument() {
    if (!current) return
    void run(async () => {
      const result = await api.shareDocument(
        userId, current.id, shareEmail
      )
      setMessage(result.message)
      setShowShare(false)
      setShareEmail('')
    })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <FileText size={28} />
          <span>CollabDocs</span>
        </div>
        <div className="user-control">
          <span>Demo user</span>
          <select
            value={userId}
            disabled={busy}
            onChange={e => switchUser(Number(e.target.value))}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <button className="primary" disabled={busy || !editor}
            onClick={createDocument}>
            <Plus size={18} /> New document
          </button>

          <label className="upload-button">
            <Upload size={18} /> Import .txt
            <input type="file" accept=".txt" disabled={busy || !editor}
              hidden onChange={e => {
                const file = e.target.files?.[0]
                if (file) importFile(file)
                e.target.value = ''
              }}
            />
          </label>

          <h3>MY DOCUMENTS</h3>
          {documents.filter(d => d.is_owner).length === 0 &&
            <p className="muted">No documents yet</p>}

          {documents.filter(d => d.is_owner).map(doc => (
            <button key={doc.id}
              disabled={busy || !editor}
              className={`document-item ${current?.id === doc.id ? 'selected' : ''}`}
              onClick={() => openDocument(doc.id)}>
              <FileText size={18} />
              <span>{doc.title}</span>
            </button>
          ))}

          <h3>SHARED WITH ME</h3>
          {documents.filter(d => !d.is_owner).length === 0 &&
            <p className="muted">No shared documents</p>}

          {documents.filter(d => !d.is_owner).map(doc => (
            <button key={doc.id}
              disabled={busy || !editor}
              className={`document-item ${current?.id === doc.id ? 'selected' : ''}`}
              onClick={() => openDocument(doc.id)}>
              <FileText size={18} />
              <span>{doc.title}<small>By {doc.owner_name}</small></span>
            </button>
          ))}
        </aside>

        <main className="main">
          {error && <div className="error" role="alert">{error}</div>}
          {message && <div className="success" role="status">{message}</div>}

          {!current ? (
            <div className="empty-state">
              <FileText size={64} />
              <h1>Welcome to CollabDocs</h1>
              <p>Create, edit and share documents in one workspace.</p>
              <button className="primary" disabled={busy || !editor}
                onClick={createDocument}>
                <Plus size={18} /> Create your first document
              </button>
            </div>
          ) : (
            <>
              <div className="document-header">
                <input className="title-input"
                  aria-label="Document title"
                  value={title} maxLength={255} disabled={busy}
                  onChange={e => {
                    setTitle(e.target.value)
                    setDirty(true)
                    setMessage('')
                  }}
                />
                <div className="actions">
                  <button className="primary" disabled={busy}
                    onClick={saveDocument}>
                    <Save size={18} /> Save
                  </button>
                  {current.is_owner && (
                    <button disabled={busy}
                      onClick={() => setShowShare(!showShare)}>
                      <Share2 size={18} /> Share
                    </button>
                  )}
                </div>
              </div>

              <p className="status">
                {busy ? 'Working...' : dirty ? 'Unsaved changes' : 'Saved'}
                {' · '}
                {current.is_owner ? 'Owned by you' : 'Shared with you'}
              </p>

              {showShare && (
                <form className="share-panel" onSubmit={e => {
                  e.preventDefault()
                  shareDocument()
                }}>
                  <label htmlFor="share-email">Share with a demo user</label>
                  <select id="share-email" value={shareEmail}
                    required disabled={busy}
                    onChange={e => setShareEmail(e.target.value)}>
                    <option value="">Select a user</option>
                    {users.filter(u => u.id !== userId).map(u => (
                      <option key={u.id} value={u.email}>{u.email}</option>
                    ))}
                  </select>
                  <button className="primary" disabled={busy}>Share</button>
                </form>
              )}

              <div className="editor-container">
                <fieldset disabled={busy} className="toolbar">
                  <button title="Bold" aria-label="Bold"
                    onClick={() => editor?.chain().focus().toggleBold().run()}>
                    <Bold size={18} />
                  </button>
                  <button title="Italic" aria-label="Italic"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}>
                    <Italic size={18} />
                  </button>
                  <button title="Underline" aria-label="Underline"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}>
                    <Underline size={18} />
                  </button>
                  <button title="Heading 1" aria-label="Heading 1"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 size={18} />
                  </button>
                  <button title="Heading 2" aria-label="Heading 2"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 size={18} />
                  </button>
                  <button title="Bullet list" aria-label="Bullet list"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                    <List size={18} />
                  </button>
                  <button title="Numbered list" aria-label="Numbered list"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered size={18} />
                  </button>
                  <button title="Undo" aria-label="Undo"
                    onClick={() => editor?.chain().focus().undo().run()}>
                    <Undo size={18} />
                  </button>
                  <button title="Redo" aria-label="Redo"
                    onClick={() => editor?.chain().focus().redo().run()}>
                    <Redo size={18} />
                  </button>
                </fieldset>
                <div className="editor-page" inert={busy}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
