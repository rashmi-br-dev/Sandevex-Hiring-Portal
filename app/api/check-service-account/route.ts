import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKeySet: !!process.env.GOOGLE_PRIVATE_KEY,
    spreadsheetId: process.env.SPREADSHEET_ID,
  });
}
