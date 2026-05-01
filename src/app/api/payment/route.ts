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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, plan, ad_id, duration_days, user_id, phone } = body

    if (!type || !user_id || !phone) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\s+/g, '').replace('+250', '0').replace('250', '0')
    if (!/^07[0-9]{8}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Numéro invalide (format: 07XXXXXXXX)' }, { status: 400 })
    }

    let amount = 0
    let meta: any = { type, user_id }

    if (type === 'boost') {
      const prices: any = { '1': 500, '3': 1000, '7': 2000, '30': 6000 }
      if (!prices[duration_days] || !ad_id) return NextResponse.json({ error: 'Boost invalide' }, { status: 400 })
      amount = prices[duration_days]
      meta.ad_id = ad_id
      meta.duration_days = duration_days
    } else if (type === 'subscription') {
      const prices: any = { pro: 8000, agence: 25000 }
      if (!prices[plan]) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
      amount = prices[plan]
      meta.plan = plan
    } else {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{ user_id, type, amount, status: 'pending', metadata: meta }])
      .select().single()
    if (paymentError) throw paymentError

    const token = await getPaypackToken()
    if (!token) throw new Error('Token Paypack introuvable')

    const paypackRes = await fetch('https://payments.paypack.rw/api/transactions/cashin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Idempotency-Key': payment.id,
      },
      body: JSON.stringify({ amount, number: cleanPhone }),
    })

    const paypackData = await paypackRes.json()
    if (paypackData.error) throw new Error(paypackData.error)

    await supabase.from('payments').update({ flw_ref: paypackData.ref }).eq('id', payment.id)

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      ref: paypackData.ref,
      message: 'Confirmez le paiement sur votre téléphone Mobile Money',
    })
  } catch (err: any) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}