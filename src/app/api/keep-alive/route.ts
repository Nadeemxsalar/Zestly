import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Apna supabase path check kar lena agar alag ho

export async function GET() {
  try {
    // Ye choti si query Supabase ko jagati rahegi
    const { data, error } = await supabase.from('recipes').select('id').limit(1);
    
    if (error) throw error;
    
    return NextResponse.json({ 
        status: 'success', 
        message: 'Supabase is awake and running! 🚀',
        timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}