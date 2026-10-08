import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(
  withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      if (req.method === "OPTIONS") {
        return new Response("ok", {
          headers: corsHeaders,
        })
      }

      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Método no permitido" }),
          {
            status: 405,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      try {
        const userId = ctx.userClaims?.sub

        if (!userId) {
          return new Response(
            JSON.stringify({ error: "No autenticado" }),
            {
              status: 401,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }

        const { data: perfil, error: perfilError } = await ctx.supabase
          .from("perfiles")
          .select("id, role")
          .eq("id", userId)
          .single()

        if (perfilError || !perfil) {
          return new Response(
            JSON.stringify({
              error: "No se encontró el perfil del administrador",
            }),
            {
              status: 403,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }

        if (perfil.role?.toLowerCase() !== "administrador") {
          return new Response(
            JSON.stringify({
              error: "No tienes permisos de administrador",
            }),
            {
              status: 403,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }

        const body = await req.json()

        const nombre = body?.nombre?.trim()
        const email = body?.email?.trim()?.toLowerCase()

        if (!nombre || !email) {
          return new Response(
            JSON.stringify({
              error: "El nombre y el correo son obligatorios",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }

        const { data: invitacion, error: invitacionError } =
          await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
              nombre,
              rol: "conductor",
            },
          })

        if (invitacionError || !invitacion?.user) {
          return new Response(
            JSON.stringify({
              error:
                invitacionError?.message ||
                "No fue posible crear el usuario",
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }

        const conductorId = invitacion.user.id

        const { data: perfilExistente } = await ctx.supabaseAdmin
          .from("perfiles")
          .select("id")
          .eq("id", conductorId)
          .maybeSingle()

        let perfilGuardado

        if (perfilExistente) {
          const { data, error } = await ctx.supabaseAdmin
            .from("perfiles")
            .update({
              email,
              full_name: nombre,
              role: "conductor",
            })
            .eq("id", conductorId)
            .select()
            .single()

          perfilGuardado = data

          if (error) {
            await ctx.supabaseAdmin.auth.admin.deleteUser(conductorId)

            return new Response(
              JSON.stringify({
                error: error.message,
              }),
              {
                status: 500,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            )
          }
        } else {
          const { data, error } = await ctx.supabaseAdmin
            .from("perfiles")
            .insert({
              id: conductorId,
              email,
              full_name: nombre,
              role: "conductor",
            })
            .select()
            .single()

          perfilGuardado = data

          if (error) {
            await ctx.supabaseAdmin.auth.admin.deleteUser(conductorId)

            return new Response(
              JSON.stringify({
                error: error.message,
              }),
              {
                status: 500,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            )
          }
        }

        return new Response(
          JSON.stringify({
            ok: true,
            message: "Conductor creado correctamente",
            conductor: perfilGuardado,
          }),
          {
            status: 201,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({
            error:
              error instanceof Error
                ? error.message
                : "Error interno del servidor",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }
    }
  )
)