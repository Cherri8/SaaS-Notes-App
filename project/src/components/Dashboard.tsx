'use client';

import { useState, useEffect } from 'react';
import NotesList from './NotesList';
import CreateNoteForm from './CreateNoteForm';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'member';
  tenant: {
    id: number;
    slug: string;
    plan: 'free' | 'pro';
  };
}

interface Note {
  id: number;
  title: string;
  content: string;
  author_email: string;
  created_at: string;
  updated_at: string;
}

interface DashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setNotes(data.notes || []);
      } else {
        setError(data.error || 'Failed to fetch notes');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const handleCreateNote = async (title: string, content: string) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'LIMIT_REACHED') {
          setError('Note limit reached. Upgrade to Pro for unlimited notes.');
          return false;
        }
        throw new Error(data.error || 'Failed to create note');
      }

      await fetchNotes();
      setShowCreateForm(false);
      setError('');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note');
      }

      await fetchNotes();
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpgrade = async () => {
    if (user.role !== 'admin') {
      setError('Only admins can upgrade subscriptions');
      return;
    }

    setUpgrading(true);
    try {
      const response = await fetch(`/api/tenants/${user.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade');
      }

      // Update user data in localStorage
      const updatedUser = { ...user, tenant: { ...user.tenant, plan: 'pro' as const } };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const canCreateMore = user.tenant.plan === 'pro' || notes.length < 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                SaaS Notes - {user.tenant.slug.charAt(0).toUpperCase() + user.tenant.slug.slice(1)}
              </h1>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {user.tenant.plan.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.email} ({user.role})
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Notes</h2>
            <div className="flex space-x-2">
              {user.tenant.plan === 'free' && user.role === 'admin' && (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                </button>
              )}
              {canCreateMore ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create Note
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  Note limit reached ({notes.length}/3)
                </div>
              )}
            </div>
          </div>

          {user.tenant.plan === 'free' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Free Plan: {notes.length}/3 notes used. 
                {user.role === 'admin' && ' Upgrade to Pro for unlimited notes.'}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {showCreateForm && (
            <CreateNoteForm
              onSubmit={handleCreateNote}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading notes...</div>
            </div>
          ) : (
            <NotesList notes={notes} onDelete={handleDeleteNote} />
          )}
        </div>
      </main>
    </div>
  );
}
