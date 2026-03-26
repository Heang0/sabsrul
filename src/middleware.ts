import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DISABLED - Firebase Auth handles authentication client-side
// This middleware was checking for cookies that Firebase doesn't set

export function middleware(request: NextRequest) {
  // For now, let all requests through
  // Firebase Auth Context handles auth checks in the frontend
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
