import { NextResponse, type NextRequest } from 'next/server'

/**
 * Simple middleware that just passes through requests.
 * Auth checks are handled in layouts and pages instead.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next()
}
