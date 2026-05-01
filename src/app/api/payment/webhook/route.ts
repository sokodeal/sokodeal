import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kind, data } = body

    if (kind !== 'CASHIN' || data?.status !== 'successful') {
      return NextResponse.json({ status: 'ignored' })
    }

    const ref = data?.ref
    if (!ref) return NextResponse.json({ status: 'no_ref' })

    const { data: payment } = await supabase
      .from('payments').select('*').eq('flw_ref', ref).eq('status', 'pending').single()
    if (!payment) return NextResponse.json({ status: 'not_found' })

    const type = payment.metadata?.type
    const userId = payment.user_id

    if (type === 'boost') {
      const adId = payment.metadata?.ad_id
      const days = parseInt(payment.metadata?.duration_days)
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + days)
      const { data: boost } = await supabase.from('boosts').insert([{
        user_id: userId, ad_id: adId, duration_days: days, price: payment.amount,
        status: 'active', is_active: true, flw_ref: ref, ends_at: endsAt.toISOString(),
      }]).select().single()
      await supabase.from('ads').update({ is_boosted: true }).eq('id', adId)
      await supabase.from('payments').update({ status: 'success', reference_id: boost?.id, payment_method: 'mobilemoney' }).eq('id', payment.id)
    }

    if (type === 'subscription') {
      const plan = payment.metadata?.plan
      const endsAt = new Date()
      endsAt.setMonth(endsAt.getMonth() + 1)
      const { data: sub } = await supabase.from('subscriptions').insert([{
        user_id: userId, plan, status: 'active', price: payment.amount,
        flw_ref: ref, ends_at: endsAt.toISOString(),
      }]).select().single()
      await supabase.from('users').update({ plan, plan_ends_at: endsAt.toISOString() }).eq('id', userId)
      await supabase.from('payments').update({ status: 'success', reference_id: sub?.id, payment_method: 'mobilemoney' }).eq('id', payment.id)
    }

    return NextResponse.json({ status: 'success' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}