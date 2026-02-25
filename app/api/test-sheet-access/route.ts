import { NextResponse } from "next/server";
import { sheets } from "@/utils/googleSheets";

export async function GET() {
  try {
    const domainPreferencesSpreadsheetId = '16ZpLttOFjfayVFijiBEQkBQ8DjyUvZLGRlL08JKU2BY';
    
    console.log("Testing access to spreadsheet:", domainPreferencesSpreadsheetId);
    
    // Test basic access
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: domainPreferencesSpreadsheetId,
    });
    
    const sheetsList = spreadsheetResponse.data.sheets?.map(sheet => sheet.properties?.title);
    
    return NextResponse.json({
      success: true,
      message: "Access granted!",
      spreadsheetId: domainPreferencesSpreadsheetId,
      availableSheets: sheetsList,
    });
  } catch (error) {
    console.error("Sheet access test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      },
      { status: 500 }
    );
  }
}
