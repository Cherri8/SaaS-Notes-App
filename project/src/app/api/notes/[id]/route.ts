import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, requireAuth } from '@/lib/auth';
import { queries } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    const user = requireAuth(token);

    const noteId = parseInt(params.id);
    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    const note = queries.getNoteById(noteId, user.tenantId);
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Get note error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    const user = requireAuth(token);

    const noteId = parseInt(params.id);
    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to tenant
    const existingNote = queries.getNoteById(noteId, user.tenantId);
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const result = queries.updateNote(title, content, noteId, user.tenantId);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const updatedNote = queries.getNoteById(noteId, user.tenantId);

    return NextResponse.json({
      message: 'Note updated successfully',
      note: updatedNote
    });
  } catch (error: any) {
    console.error('Update note error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    const user = requireAuth(token);

    const noteId = parseInt(params.id);
    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to tenant
    const existingNote = queries.getNoteById(noteId, user.tenantId);
    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const result = queries.deleteNote(noteId, user.tenantId);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Note deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete note error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
