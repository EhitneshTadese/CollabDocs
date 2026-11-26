import type { JSONContent } from '@tiptap/react'

export interface User {
  id: number
  name: string
  email: string
}

export interface DocumentSummary {
  id: number
  title: string
  owner_id: number
  owner_name: string
  is_owner: boolean
  updated_at: string
}

export interface DocumentData {
  id: number
  title: string
  owner_id: number
  content: JSONContent
  updated_at: string
  is_owner?: boolean
}

async function request<T>(
  url: string,
  userId?: number,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  if (userId !== undefined) {
    headers.set('x-user-id', String(userId))
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data as T
}

export const api = {
  getUsers: () =>
    request<User[]>('/users'),

  getDocuments: (userId: number) =>
    request<DocumentSummary[]>('/documents', userId),

  getDocument: (userId: number, documentId: number) =>
    request<DocumentData>(
      `/documents/${documentId}`,
      userId
    ),

  createDocument: (
    userId: number,
    title = 'Untitled Document',
    content?: JSONContent
  ) =>
    request<DocumentData>('/documents', userId, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  saveDocument: (
    userId: number,
    documentId: number,
    title: string,
    content: JSONContent
  ) =>
    request<DocumentData>(
      `/documents/${documentId}`,
      userId,
      {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
      }
    ),

  shareDocument: (
    userId: number,
    documentId: number,
    email: string
  ) =>
    request<{ message: string }>(
      `/documents/${documentId}/share`,
      userId,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    ),
}
