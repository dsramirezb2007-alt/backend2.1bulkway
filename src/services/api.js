import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const EXPRESS_API_URL =
  import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3000/api'

export async function apiRequest(endpoint, options = {}) {
  const { data: { session } = {} } = supabase
    ? await supabase.auth.getSession()
    : { data: {} }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const { api = 'json-server', ...fetchOptions } = options

  const baseURL =
    api === 'express' ? EXPRESS_API_URL : API_URL

  const response = await fetch(`${baseURL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    let mensaje = `No fue posible completar la operación (${response.status})`

    try {
      const errorData = await response.json()
      if (errorData?.error) {
        mensaje = errorData.error
      }
    } catch {
    }

    throw new Error(mensaje)
  }

  return response.status === 204 ? null : response.json()
}