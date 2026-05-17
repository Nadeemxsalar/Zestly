import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Apna supabase path check kar lena

export async function GET() {
  try {
    // 1. Supabase ko jagane ke liye simple query (Wake Up Call)
    const { error: wakeError } = await supabase.from('recipes').select('id').limit(1);
    if (wakeError) throw wakeError;

    // 2. Admin Panel ke liye 'bot_ping_count' ko +1 karna
    const { data: settings } = await supabase
      .from('app_settings')
      .select('bot_ping_count')
      .eq('id', 1)
      .single();

    const currentCount = settings?.bot_ping_count || 0;

    // Counter update kar rahe hain
    await supabase
      .from('app_settings')
      .update({ bot_ping_count: currentCount + 1 })
      .eq('id', 1);
    
    return NextResponse.json({ 
        status: 'success', 
        message: `Supabase is awake! 🚀 Total Pings: ${currentCount + 1}`,
        timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}