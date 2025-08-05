import { google } from 'googleapis';
import { readFileSync } from 'fs';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(readFileSync('./service-account-key.json', 'utf-8')),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

export async function addCalendarEvent(startDateTime, endDateTime) {
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

  await calendar.events.insert({
    calendarId: 'primary', // or your custom calendar ID
    resource: event,
  });

  console.log('✅ Event added to calendar');
}
