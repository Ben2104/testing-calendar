import { google } from 'googleapis';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file (only in local development)
if (!process.env.GITHUB_ACTIONS) {
  dotenv.config();
}

const credentialsFile = process.env.GITHUB_ACTIONS ? './service-account-key.json' : (process.env.CREDENTIALS_FILE || './credentials.json');

// Load TIME_SLOTS from environment variable or fallback to default
const TIME_SLOTS = process.env.TIME_SLOTS
  ? process.env.TIME_SLOTS.split(',')
  : ["7-7:30am", "7:30-8am", "8-8:30am", "8:30-9am"];

const CALENDAR_ID = process.env.CALENDAR_ID || '65b939118e3c9b5e436484429b3cecb9c9b6c7d326ba770071f1aeeb0d7a5bba@group.calendar.google.com';

// Function to parse time slots and get start/end times
function parseTimeSlots(timeSlots) {
  console.log('🕒 Parsing time slots:', timeSlots);
  
  // Get first slot start time
  const firstSlot = timeSlots[0]; // "7-7:30am"
  const startTime = firstSlot.split('-')[0]; // "7"
  
  // Get last slot end time
  const lastSlot = timeSlots[timeSlots.length - 1]; // "8:30-9am"
  const endTime = lastSlot.split('-')[1]; // "9am"
  
  console.log('⏰ Start time:', startTime);
  console.log('⏰ End time:', endTime);
  
  return { startTime, endTime };
}

// Function to convert time string to 24-hour format
function convertTo24Hour(timeStr) {
  // Remove 'am' and handle cases like "7", "7:30", "9"
  const cleanTime = timeStr.replace('am', '').trim();
  
  if (cleanTime.includes(':')) {
    return cleanTime + ':00'; // "7:30" -> "7:30:00"
  } else {
    return cleanTime + ':00:00'; // "7" -> "7:00:00", "9" -> "9:00:00"
  }
}

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
      calendarId: CALENDAR_ID,
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
    
    // Parse the time slots to get start and end times
    const { startTime, endTime } = parseTimeSlots(TIME_SLOTS);
    
    // Convert to 24-hour format and create ISO strings
    const startHour = convertTo24Hour(startTime);
    const endHour = convertTo24Hour(endTime);
    
    const startDateTime = `${today}T${startHour}-07:00`;
    const endDateTime = `${today}T${endHour}-07:00`;
    
    console.log('🕐 Final start time:', startDateTime);
    console.log('🕐 Final end time:', endDateTime);
    
    await addCalendarEvent(startDateTime, endDateTime);
  } catch (error) {
    console.error('💥 Main execution failed:', error);
    process.exit(1);
  }
}

main();