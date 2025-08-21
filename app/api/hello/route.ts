import { NextRequest, NextResponse } from "next/server";

// GET /api/hello
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "World";

  return NextResponse.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    method: "GET",
  });
}

// POST /api/hello
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || "World";

    return NextResponse.json({
      message: `Hello, ${name}! (via POST)`,
      receivedData: body,
      timestamp: new Date().toISOString(),
      method: "POST",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }
}
