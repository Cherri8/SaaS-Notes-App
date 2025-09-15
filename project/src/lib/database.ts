import bcrypt from 'bcryptjs';

// In-memory database for deployment compatibility
interface Tenant {
  id: number;
  slug: string;
  name: string;
  plan: 'free' | 'pro';
  created_at: string;
}

interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'member';
  tenant_id: number;
  created_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  user_id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

// In-memory storage
let tenants: Tenant[] = [];
let users: User[] = [];
let notes: Note[] = [];
let nextTenantId = 1;
let nextUserId = 1;
let nextNoteId = 1;
let initialized = false;

// Initialize database with default data
export function initializeDatabase() {
  if (initialized) return;
  
  // Create default tenants
  const acmeTenant: Tenant = {
    id: nextTenantId++,
    slug: 'acme',
    name: 'Acme Corporation',
    plan: 'free',
    created_at: new Date().toISOString()
  };
  
  const globexTenant: Tenant = {
    id: nextTenantId++,
    slug: 'globex',
    name: 'Globex Corporation',
    plan: 'free',
    created_at: new Date().toISOString()
  };
  
  tenants.push(acmeTenant, globexTenant);
  
  // Create default users
  const passwordHash = bcrypt.hashSync('password', 10);
  
  const defaultUsers: User[] = [
    {
      id: nextUserId++,
      email: 'admin@acme.test',
      password_hash: passwordHash,
      role: 'admin',
      tenant_id: acmeTenant.id,
      created_at: new Date().toISOString()
    },
    {
      id: nextUserId++,
      email: 'user@acme.test',
      password_hash: passwordHash,
      role: 'member',
      tenant_id: acmeTenant.id,
      created_at: new Date().toISOString()
    },
    {
      id: nextUserId++,
      email: 'admin@globex.test',
      password_hash: passwordHash,
      role: 'admin',
      tenant_id: globexTenant.id,
      created_at: new Date().toISOString()
    },
    {
      id: nextUserId++,
      email: 'user@globex.test',
      password_hash: passwordHash,
      role: 'member',
      tenant_id: globexTenant.id,
      created_at: new Date().toISOString()
    }
  ];
  
  users.push(...defaultUsers);
  initialized = true;
}

// Database query functions
export const queries = {
  // Tenant queries
  getTenantBySlug: (slug: string) => {
    return tenants.find(t => t.slug === slug);
  },
  
  updateTenantPlan: (plan: 'free' | 'pro', slug: string) => {
    const tenant = tenants.find(t => t.slug === slug);
    if (tenant) {
      tenant.plan = plan;
      return { changes: 1 };
    }
    return { changes: 0 };
  },

  // User queries
  getUserByEmail: (email: string) => {
    const user = users.find(u => u.email === email);
    if (!user) return undefined;
    
    const tenant = tenants.find(t => t.id === user.tenant_id);
    return {
      ...user,
      tenant_slug: tenant?.slug,
      tenant_plan: tenant?.plan
    };
  },
  
  getUserById: (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return undefined;
    
    const tenant = tenants.find(t => t.id === user.tenant_id);
    return {
      ...user,
      tenant_slug: tenant?.slug,
      tenant_plan: tenant?.plan
    };
  },

  // Notes queries
  getNotesByTenant: (tenantId: number) => {
    return notes
      .filter(n => n.tenant_id === tenantId)
      .map(note => {
        const user = users.find(u => u.id === note.user_id);
        return {
          ...note,
          author_email: user?.email || 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  
  getNoteById: (id: number, tenantId: number) => {
    const note = notes.find(n => n.id === id && n.tenant_id === tenantId);
    if (!note) return undefined;
    
    const user = users.find(u => u.id === note.user_id);
    return {
      ...note,
      author_email: user?.email || 'Unknown'
    };
  },
  
  createNote: (title: string, content: string, userId: number, tenantId: number) => {
    const note: Note = {
      id: nextNoteId++,
      title,
      content,
      user_id: userId,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    notes.push(note);
    return { lastInsertRowid: note.id };
  },
  
  updateNote: (title: string, content: string, id: number, tenantId: number) => {
    const noteIndex = notes.findIndex(n => n.id === id && n.tenant_id === tenantId);
    if (noteIndex === -1) return { changes: 0 };
    
    notes[noteIndex] = {
      ...notes[noteIndex],
      title,
      content,
      updated_at: new Date().toISOString()
    };
    
    return { changes: 1 };
  },
  
  deleteNote: (id: number, tenantId: number) => {
    const noteIndex = notes.findIndex(n => n.id === id && n.tenant_id === tenantId);
    if (noteIndex === -1) return { changes: 0 };
    
    notes.splice(noteIndex, 1);
    return { changes: 1 };
  },
  
  countNotesByTenant: (tenantId: number) => {
    const count = notes.filter(n => n.tenant_id === tenantId).length;
    return { count };
  }
};
