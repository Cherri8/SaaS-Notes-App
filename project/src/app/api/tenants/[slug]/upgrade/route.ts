import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, requireAuth, requireRole } from '@/lib/auth';
import { queries } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    const user = requireAuth(token);
    
    // Only admins can upgrade subscriptions
    requireRole(user, 'admin');
    
    // Verify the user belongs to the tenant they're trying to upgrade
    if (user.tenantSlug !== params.slug) {
      return NextResponse.json(
        { error: 'Access denied: Cannot upgrade other tenants' },
        { status: 403 }
      );
    }

    // Update tenant plan to pro
    const result = queries.updateTenantPlan('pro', params.slug);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subscription upgraded to Pro successfully',
      tenant: {
        slug: params.slug,
        plan: 'pro'
      }
    });
  } catch (error: any) {
    console.error('Upgrade error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
