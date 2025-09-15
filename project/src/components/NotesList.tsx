'use client';

interface Note {
  id: number;
  title: string;
  content: string;
  author_email: string;
  created_at: string;
  updated_at: string;
}

interface NotesListProps {
  notes: Note[];
  onDelete: (noteId: number) => void;
}

export default function NotesList({ notes, onDelete }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No notes yet. Create your first note!</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <div key={note.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {note.title}
            </h3>
            <button
              onClick={() => onDelete(note.id)}
              className="text-red-500 hover:text-red-700 ml-2"
              title="Delete note"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-3">{note.content}</p>
          <div className="text-xs text-gray-400">
            <div>By: {note.author_email}</div>
            <div>Created: {new Date(note.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
