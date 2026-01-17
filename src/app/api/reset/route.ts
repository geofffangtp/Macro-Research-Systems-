import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { resetType } = await request.json();

    // Delete data from Supabase tables
    if (resetType === 'all' || resetType === 'sources') {
      // Delete source items first (foreign key constraint)
      await supabase.from('source_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Delete sources
      await supabase.from('sources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resetType === 'all' || resetType === 'data_releases') {
      await supabase.from('data_releases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resetType === 'all' || resetType === 'knowledge') {
      await supabase.from('knowledge_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resetType === 'all' || resetType === 'predictions') {
      await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resetType === 'all' || resetType === 'digests') {
      await supabase.from('digests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resetType === 'all' || resetType === 'chat') {
      await supabase.from('chat_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resetType === 'all' || resetType === 'thesis') {
      await supabase.from('thesis').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${resetType} data successfully. Reload the page to reinitialize.`
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset data', details: String(error) },
      { status: 500 }
    );
  }
}
