import { google } from 'googleapis';
import { readFileSync } from 'fs';

const credentialsFile = process.env.GITHUB_ACTIONS ? './service-account-key.json' : './credentials.json';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(readFileSync(credentialsFile, 'utf-8')),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});


const calendar = google.calendar({ version: 'v3', auth });

export async function addCalendarEvent(startDateTime, endDateTime) {
  try {
    console.log('🔍 Attempting to create event...');
    console.log('Start time:', startDateTime);
    console.log('End time:', endDateTime);
    
    const event = {
      summary: '🏓 Pickleball Reservation',
      location: 'iPickle Cerritos',
      description: 'Reserved by bot',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Los_Angeles',
      },
    };

    console.log('📅 Event object:', JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId: '65b939118e3c9b5e436484429b3cecb9c9b6c7d326ba770071f1aeeb0d7a5bba@group.calendar.google.com',
      resource: event,
    });

    console.log('✅ Event added to calendar');
    console.log('📋 Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error adding event to calendar:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    throw error;
  }
}

// Add error handling for the main execution
async function main() {
  try {
    console.log('🚀 Starting calendar event creation...');
    
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    console.log('📅 Today:', today);
    
    const startDateTime = `${today}T07:00:00-07:00`;
    const endDateTime = `${today}T09:00:00-07:00`;
    
    await addCalendarEvent(startDateTime, endDateTime);
  } catch (error) {
    console.error('💥 Main execution failed:', error);
    process.exit(1);
  }
}

main();