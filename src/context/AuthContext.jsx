import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [rol, setRol] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargarPerfil = async (user) => {
    if (!user || !supabase) {
      setRol(null)
      return
    }

    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !perfil) {
      console.error('Error al cargar el perfil:', error)
      setRol(null)
      return
    }

    setRol(perfil.role?.toLowerCase() ?? null)
  }

  useEffect(() => {
    if (!supabase) {
      setCargando(false)
      return undefined
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session ?? null
      const user = session?.user ?? null

      setUsuario(user)
      await cargarPerfil(user)
      setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null

        setUsuario(user)
        await cargarPerfil(user)

        setCargando(false)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const cerrarSesion = async () => {
    if (supabase) await supabase.auth.signOut()

    setUsuario(null)
    setRol(null)
  }

  return (
    <AuthContext.Provider
      value={{ usuario, rol, cargando, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}