import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, requireAuth } from '@/lib/auth';
import { queries } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    const user = requireAuth(token);

    const notes = queries.getNotesByTenant(user.tenantId);

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Get notes error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    const user = requireAuth(token);

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Check subscription limits for free plan
    if (user.tenantPlan === 'free') {
      const noteCount = queries.countNotesByTenant(user.tenantId);
      if (noteCount.count >= 3) {
        return NextResponse.json(
          { 
            error: 'Note limit reached. Upgrade to Pro for unlimited notes.',
            code: 'LIMIT_REACHED'
          },
          { status: 403 }
        );
      }
    }

    const result = queries.createNote(title, content, user.userId, user.tenantId);
    
    const newNote = queries.getNoteById(result.lastInsertRowid, user.tenantId);

    return NextResponse.json({ 
      message: 'Note created successfully',
      note: newNote 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create note error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
