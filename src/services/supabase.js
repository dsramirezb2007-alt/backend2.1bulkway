import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const getTabId = () => {
  if (typeof window === 'undefined') {
    return 'server'
  }

  const key = '__bulkway_tab_id__'

  if (!window.name) {
    window.name = crypto.randomUUID()
  }

  let tabId = window.name

  if (!tabId) {
    tabId = crypto.randomUUID()
    window.name = tabId
  }

  return tabId
}

const tabId = getTabId()

const storage =
  typeof window !== 'undefined'
    ? window.sessionStorage
    : undefined

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          storageKey: `bulkway-session-${tabId}`,
          storage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null

export const supabaseActivacion =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          storageKey: `bulkway-activation-${tabId}`,
          storage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null