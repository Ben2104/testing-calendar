import { google } from 'googleapis';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file (only in local development)
if (!process.env.GITHUB_ACTIONS) {
  dotenv.config();
}

const credentialsFile = process.env.GITHUB_ACTIONS ? './service-account-key.json' : (process.env.GOOGLE_CREDENTIALS || './credentials.json');

// Load TIME_SLOTS from environment variable or fallback to default
const TIME_SLOTS = process.env.TIME_SLOTS
  ? process.env.TIME_SLOTS.split(',')
  : ["8-8:30pm", "8:30-9pm", "9-9:30pm", "9:30-10pm"];

const CALENDAR_ID = process.env.CALENDAR_ID || '65b939118e3c9b5e436484429b3cecb9c9b6c7d326ba770071f1aeeb0d7a5bba@group.calendar.google.com';

// Function to parse time slots and get start/end times
// Function to parse time slots and get start/end times
function parseTimeSlots(timeSlots) {
  console.log('🕒 Parsing time slots:', timeSlots);
  
  // Get first slot start time - need to preserve AM/PM from the slot
  const firstSlot = timeSlots[0]; // "7-7:30pm"
  const startTime = firstSlot.split('-')[0]; // "7"
  
  // Get last slot end time
  const lastSlot = timeSlots[timeSlots.length - 1]; // "8:30-9pm"  
  const endTime = lastSlot.split('-')[1]; // "9pm"
  
  // For start time, we need to infer AM/PM from the slot
  // If the slot contains 'pm', the start time should also be 'pm'
  // If the slot contains 'am', the start time should also be 'am'
  let startTimeWithPeriod = startTime;
  if (firstSlot.includes('pm')) {
    startTimeWithPeriod = startTime + 'pm';
  } else if (firstSlot.includes('am')) {
    startTimeWithPeriod = startTime + 'am';
  }
  
  console.log('⏰ Start time:', startTimeWithPeriod);
  console.log('⏰ End time:', endTime);
  
  return { startTime: startTimeWithPeriod, endTime };
}

// Function to convert time string to 24-hour format
function convertTo24Hour(timeStr) {
  const isPM = timeStr.includes('pm');
  const isAM = timeStr.includes('am');
  
  // Remove 'am' or 'pm' and handle cases like "7", "7:30", "9"
  const cleanTime = timeStr.replace(/(am|pm)/g, '').trim();
  
  let hour, minute;
  
  if (cleanTime.includes(':')) {
    [hour, minute] = cleanTime.split(':');
  } else {
    hour = cleanTime;
    minute = '00';
  }
  
  // Convert to 24-hour format
  let hour24 = parseInt(hour);
  
  if (isPM && hour24 !== 12) {
    hour24 += 12;
  } else if (isAM && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minute}:00`;
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