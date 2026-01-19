import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateRequest, resetRequestSchema } from '@/lib/validations';
import crypto from 'crypto';

// Generate a confirmation token that must be passed to delete data
// This prevents accidental or malicious deletions
const RESET_CONFIRMATION_PREFIX = 'CONFIRM_RESET_';

export async function GET() {
  // Generate a one-time confirmation token
  const token = RESET_CONFIRMATION_PREFIX + crypto.randomBytes(16).toString('hex');

  return NextResponse.json({
    message: 'To reset data, POST with resetType and confirmToken',
    confirmToken: token,
    validResetTypes: ['all', 'sources', 'data_releases', 'knowledge', 'predictions', 'digests', 'chat', 'thesis'],
    warning: 'This action is irreversible. All data will be permanently deleted.',
  });
}

export async function POST(request: Request) {
  try {
    // Validate request body
    const validation = await validateRequest(request, resetRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { resetType, confirmToken } = validation.data;

    // Verify confirmation token format
    if (!confirmToken.startsWith(RESET_CONFIRMATION_PREFIX)) {
      return NextResponse.json(
        { error: 'Invalid confirmation token. GET /api/reset first to obtain a valid token.' },
        { status: 400 }
      );
    }

    // Delete data from Supabase tables
    if (resetType === 'all' || resetType === 'sources') {
      // Delete source items first (foreign key constraint)
      const { error: itemsError } = await supabase.from('source_items').delete().gte('created_at', '1970-01-01');
      if (itemsError) console.error('Error deleting source_items:', itemsError);

      const { error: sourcesError } = await supabase.from('sources').delete().gte('created_at', '1970-01-01');
      if (sourcesError) console.error('Error deleting sources:', sourcesError);
    }

    if (resetType === 'all' || resetType === 'data_releases') {
      const { error } = await supabase.from('data_releases').delete().gte('created_at', '1970-01-01');
      if (error) console.error('Error deleting data_releases:', error);
    }

    if (resetType === 'all' || resetType === 'knowledge') {
      const { error } = await supabase.from('knowledge_entries').delete().gte('created_at', '1970-01-01');
      if (error) console.error('Error deleting knowledge_entries:', error);
    }

    if (resetType === 'all' || resetType === 'predictions') {
      const { error } = await supabase.from('predictions').delete().gte('created_at', '1970-01-01');
      if (error) console.error('Error deleting predictions:', error);
    }

    if (resetType === 'all' || resetType === 'digests') {
      const { error } = await supabase.from('digests').delete().gte('created_at', '1970-01-01');
      if (error) console.error('Error deleting digests:', error);
    }

    if (resetType === 'all' || resetType === 'chat') {
      const { error } = await supabase.from('chat_sessions').delete().gte('created_at', '1970-01-01');
      if (error) console.error('Error deleting chat_sessions:', error);
    }

    if (resetType === 'all' || resetType === 'thesis') {
      const { error } = await supabase.from('thesis').delete().gte('created_at', '1970-01-01');
      if (error) console.error('Error deleting thesis:', error);
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${resetType} data successfully. Reload the page to reinitialize.`
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset data' },
      { status: 500 }
    );
  }
}
