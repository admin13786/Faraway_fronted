const DEFAULT_API_BASE_URL = 'http://10.26.6.117:8088'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
const TOKEN_KEY = 'faraway_web_token'
const USER_KEY = 'faraway_web_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function buildQuery(data) {
  const params = new URLSearchParams()
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

async function parseResponse(response) {
  const text = await response.text()
  let body = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { message: text && text.trim().startsWith('<') ? `HTTP ${response.status}` : text }
  }
  if (!response.ok) {
    const detail = body && (body.detail || body.message)
    const error = new Error(typeof detail === 'string' ? detail : `HTTP ${response.status}`)
    error.status = response.status
    error.code = body && body.code
    error.response = body
    throw error
  }
  if (body && Object.prototype.hasOwnProperty.call(body, 'code')) {
    if (body.code !== 0) {
      const error = new Error(body.message || 'Request failed')
      error.code = body.code
      error.response = body
      throw error
    }
    return body.data ?? {}
  }
  return body
}

export async function request(path, options = {}) {
  const method = options.method || 'GET'
  const headers = { ...(options.headers || {}) }
  const token = getToken()
  let url = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`
  let body

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.data && method.toUpperCase() === 'GET') {
    url += buildQuery(options.data)
  } else if (options.data !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.data)
  }

  const response = await fetch(url, { method, headers, body })
  if (response.status === 401) {
    clearSession()
  }
  return parseResponse(response)
}

export async function uploadFile(file, kind) {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`${API_BASE_URL}/api/upload/${kind}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  })
  return parseResponse(response)
}

export const api = {
  passwordLogin: (data) => request('/api/auth/password-login', { method: 'POST', data }),
  register: (data) => request('/api/auth/register', { method: 'POST', data }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  profile: () => request('/api/user/profile'),
  updateProfile: (data) => request('/api/user/profile', { method: 'PUT', data }),
  stats: () => request('/api/user/stats'),
  feed: () => request('/api/home/feed'),
  strategies: (data = {}) => request('/api/strategies', { data }),
  posts: (data = {}) => request('/api/posts', { data }),
  strategyDetail: (id) => request(`/api/strategies/${id}`),
  postDetail: (id) => request(`/api/posts/${id}`),
  createStrategy: (data) => request('/api/strategies', { method: 'POST', data }),
  createStrategyDraft: (data) => request('/api/strategies/drafts', { method: 'POST', data }),
  updateStrategy: (id, data) => request(`/api/strategies/${id}`, { method: 'PUT', data }),
  deleteStrategy: (id) => request(`/api/strategies/${id}`, { method: 'DELETE' }),
  createPost: (data) => request('/api/posts', { method: 'POST', data }),
  createPostDraft: (data) => request('/api/posts/drafts', { method: 'POST', data }),
  updatePost: (id, data) => request(`/api/posts/${id}`, { method: 'PUT', data }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),
  drafts: () => request('/api/my/drafts'),
  deleteDraft: (id) => request(`/api/my/drafts/${id}`, { method: 'DELETE' }),
  myPosts: () => request('/api/my/posts', { data: { pageSize: 100 } }),
  myContent: (userId) => request(`/api/users/${userId}/contents`, { data: { pageSize: 100 } }),
  notifications: () => request('/api/my/notifications'),
  readNotification: (id) => request(`/api/my/notifications/${id}/read`, { method: 'POST' }),
  readAllNotifications: () => request('/api/my/notifications/read-all', { method: 'POST' }),
  createRecruitment: (data) => request('/api/matches/recruitments', { method: 'POST', data }),
  recommendMatches: (data) => request('/api/matches/recommend', { method: 'POST', data }),
  applyRecruitment: (id) => request(`/api/matches/recruitments/${id}/apply`, { method: 'POST' }),
  myRecruitments: () => request('/api/my/recruitments'),
  myApplications: () => request('/api/my/match-applications'),
  approveApplication: (recruitId, applicationId) => request(`/api/my/recruitments/${recruitId}/applications/${applicationId}/approve`, { method: 'POST' }),
  rejectApplication: (recruitId, applicationId) => request(`/api/my/recruitments/${recruitId}/applications/${applicationId}/reject`, { method: 'POST' }),
  createRealtime: (data) => request('/api/match/realtime', { method: 'POST', data }),
  currentRealtime: () => request('/api/match/realtime/current'),
  realtimeHistory: () => request('/api/match/realtime/history'),
  acceptCandidate: (id) => request(`/api/match/realtime/candidate/${id}/accept`, { method: 'POST' }),
  rejectCandidate: (id) => request(`/api/match/realtime/candidate/${id}/reject`, { method: 'POST' }),
  cancelRealtime: (id) => request(`/api/match/realtime/${id}/cancel`, { method: 'POST' }),
  remarkPair: (id, remark) => request(`/api/match/realtime/pair/${id}/remark`, { method: 'POST', data: { remark } }),
  ratePair: (id, data) => request(`/api/match/realtime/pair/${id}/rate`, { method: 'POST', data })
}
