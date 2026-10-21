import { NextRequest, NextResponse } from 'next/server';
import { executeSingleStep } from '@/core/engine/runnerEngine';

export const dynamic = 'force-dynamic';

/**
 * Local Next.js API Runner Proxy
 * Executes API workflow steps locally on the user's machine.
 * Has direct access to localhost:* ports, avoids CORS restrictions, and manages raw cookies without browser blocks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, variablesContext, cookiesContext } = body || {};

    if (!step) {
      return NextResponse.json({ error: 'Missing step data' }, { status: 400 });
    }

    const result = await executeSingleStep(
      step,
      variablesContext || {},
      cookiesContext || {}
    );

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('Local runner execution error:', err);
    return NextResponse.json(
      { error: err.message || 'Local execution failed' },
      { status: 500 }
    );
  }
}
