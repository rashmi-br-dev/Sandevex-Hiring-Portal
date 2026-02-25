import { NextResponse } from "next/server";
import { sheets } from "@/utils/googleSheets";

export async function GET() {
  try {
    console.log("Testing Google Sheets connection...");
    console.log("SPREADSHEET_ID:", process.env.SPREADSHEET_ID);
    console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "Set" : "Not set");
    console.log("GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "Set" : "Not set");
    
    // Test basic connection by getting spreadsheet info
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
    });
    
    const sheetsList = spreadsheetResponse.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    }));
    
    return NextResponse.json({
      success: true,
      spreadsheetId: process.env.SPREADSHEET_ID,
      sheets: sheetsList,
    });
  } catch (error) {
    console.error("Google Sheets test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        spreadsheetId: process.env.SPREADSHEET_ID,
      },
      { status: 500 }
    );
  }
}
