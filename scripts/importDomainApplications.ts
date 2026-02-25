import { sheets } from '../utils/googleSheets';
import { connectDB } from '../lib/db';
import DomainPreference from '../models/DomainPreference';

export async function importDomainApplications() {
  try {
    await connectDB();
    
    // Use the specific domain preferences spreadsheet ID
    const domainPreferencesSpreadsheetId = '16ZpLttOFjfayVFijiBEQkBQ8DjyUvZLGRlL08JKU2BY';
    
    console.log("Checking domain preferences spreadsheet with ID:", domainPreferencesSpreadsheetId);
    
    // First, let's check if the spreadsheet exists and get sheet names
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: domainPreferencesSpreadsheetId,
    });
    
    console.log("Available sheets:", spreadsheetResponse.data.sheets?.map(sheet => sheet.properties?.title));
    
    // Try to get data with the correct sheet name
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: domainPreferencesSpreadsheetId,
      range: 'Form Responses 1!A1:Z1000', // Use the actual sheet name
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the sheet');
      return { success: true, imported: 0 };
    }
    
    console.log(`Found ${rows.length} rows in the sheet`);
    
    // Skip header row and process each entry
    const headers = rows[0];
    console.log("Headers:", headers);
    const dataRows = rows.slice(1);
    
    let importedCount = 0;
    
    for (const row of dataRows) {
      if (!row[0]) continue; // Skip empty rows
      
      // Map columns to fields based on your Google Form structure
      const domainPreference = {
        timestamp: new Date(row[0]),
        fullName: row[1],
        email: row[2],
        contactNumber: row[3],
        collegeName: row[4],
        yearOfStudy: row[5],
        domain: row[6],
        skillLevel: row[7],
        interestReason: row[8],
        technologies: [row[9], row[10], row[11]].filter(tech => tech && tech.trim()), // Combine technology columns
        emailAddress: row[12] || row[2] // Use email address if available, fallback to email
      };
      
      // Check if email already exists
      const existingPreference = await DomainPreference.findOne({ email: domainPreference.email });
      
      if (existingPreference) {
        console.log(`Email ${domainPreference.email} already exists, skipping...`);
        continue;
      }
      
      // Create new domain preference
      await DomainPreference.create(domainPreference);
      console.log(`Imported domain preference for ${domainPreference.email}`);
      importedCount++;
    }
    
    console.log('Domain preferences import completed successfully');
    return { success: true, imported: importedCount };
    
  } catch (error) {
    console.error('Error importing domain applications:', error);
    throw error;
  }
}
