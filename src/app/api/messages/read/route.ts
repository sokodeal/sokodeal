import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const { message_ids } = await req.json()
    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: userData } = await serviceClient
      .from('users')
      .select('hide_read_receipts')
      .eq('id', user.id)
      .single()

    const updatePayload = userData?.hide_read_receipts
      ? { is_read: true }
      : { is_read: true, read_at: new Date().toISOString() }

    const { data, error } = await serviceClient
      .from('messages')
      .update(updatePayload)
      .eq('receiver_id', user.id)
      .is('read_at', null)
      .in('id', message_ids)
      .select('id, read_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: data?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
