import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getPaypackToken() {
  const res = await fetch('https://payments.paypack.rw/api/auth/agents/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_CLIENT_ID,
      client_secret: process.env.PAYPACK_CLIENT_SECRET,
    }),
  })
  const data = await res.json()
  return data.access
}

async function activatePayment(payment: any) {
  const type = payment.metadata?.type
  const userId = payment.user_id

  if (type === 'boost') {
    const adId = payment.metadata?.ad_id
    const days = parseInt(payment.metadata?.duration_days)
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + days)
    const { data: boost } = await supabase.from('boosts').insert([{
      user_id: userId, ad_id: adId, duration_days: days, price: payment.amount,
      status: 'active', is_active: true, flw_ref: payment.flw_ref, ends_at: endsAt.toISOString(),
    }]).select().single()
    await supabase.from('ads').update({ is_boosted: true }).eq('id', adId)
    await supabase.from('payments').update({ status: 'success', reference_id: boost?.id }).eq('id', payment.id)
  }

  if (type === 'subscription') {
    const plan = payment.metadata?.plan
    const endsAt = new Date()
    endsAt.setMonth(endsAt.getMonth() + 1)
    const { data: sub } = await supabase.from('subscriptions').insert([{
      user_id: userId, plan, status: 'active', price: payment.amount,
      flw_ref: payment.flw_ref, ends_at: endsAt.toISOString(),
    }]).select().single()
    await supabase.from('users').update({ plan, plan_ends_at: endsAt.toISOString() }).eq('id', userId)
    await supabase.from('payments').update({ status: 'success', reference_id: sub?.id }).eq('id', payment.id)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { payment_id, ref } = await req.json()

    let query = supabase.from('payments').select('*')
    if (payment_id) query = query.eq('id', payment_id)
    else if (ref) query = query.eq('flw_ref', ref)
    else return NextResponse.json({ error: 'payment_id ou ref requis' }, { status: 400 })

    const { data: payment } = await query.single()
    if (!payment) return NextResponse.json({ success: false, error: 'Introuvable' })
    if (payment.status === 'success') return NextResponse.json({ success: true, status: 'already_processed', type: payment.metadata?.type })
    if (payment.status === 'failed') return NextResponse.json({ success: false, status: 'failed' })

    const paypackRef = payment.flw_ref
    if (!paypackRef) return NextResponse.json({ success: false, status: 'pending', message: 'En attente' })

    const token = await getPaypackToken()
    const verifyRes = await fetch(`https://payments.paypack.rw/api/transactions/find/${paypackRef}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    const verifyData = await verifyRes.json()

    if (verifyData.status === 'successful') {
      await activatePayment(payment)
      return NextResponse.json({ success: true, type: payment.metadata?.type })
    } else if (verifyData.status === 'failed') {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      return NextResponse.json({ success: false, status: 'failed' })
    } else {
      return NextResponse.json({ success: false, status: 'pending', message: 'En attente de confirmation MoMo' })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}