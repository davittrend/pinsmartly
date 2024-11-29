// pin-scheduler.ts
import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import type { ScheduledPin } from '../../src/types/pinterest';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

const database = getDatabase();
const auth = getAuth();

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  // Debug logging
  console.log('Request headers:', event.headers);
  console.log('Authorization header:', event.headers.authorization);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // Extract and verify the authorization token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      console.log('No authorization header found');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No authorization header' }),
      };
    }

    // Extract the token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split('Bearer ')[1] 
      : authHeader;

    if (!token) {
      console.log('No token found in authorization header');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No token provided' }),
      };
    }

    // Verify the Firebase token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Verified user ID:', userId);

      const pinsRef = database.ref(`users/${userId}/scheduled_pins`);

      switch (event.httpMethod) {
        case 'GET': {
          console.log('Processing GET request');
          const snapshot = await pinsRef.orderByChild('scheduledTime').once('value');
          const pins: ScheduledPin[] = [];

          snapshot.forEach((childSnapshot) => {
            pins.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
            });
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ pins }),
          };
        }

        case 'POST': {
          console.log('Processing POST request');
          if (!event.body) {
            throw new Error('Request body is empty');
          }

          const pins = JSON.parse(event.body) as ScheduledPin[];
          const updates: Record<string, any> = {};

          pins.forEach((pin) => {
            if (!pin.id) {
              throw new Error('Pin ID is required');
            }
            updates[pin.id] = pin;
          });

          await pinsRef.update(updates);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true }),
          };
        }

        case 'DELETE': {
          console.log('Processing DELETE request');
          if (!event.body) {
            throw new Error('Request body is empty');
          }

          const { pinId } = JSON.parse(event.body);

          if (!pinId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Pin ID required' }),
            };
          }

          await pinsRef.child(pinId).remove();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true }),
          };
        }

        default:
          return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
          };
      }
    } catch (verificationError) {
      console.error('Token verification error:', verificationError);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

  } catch (error) {
    console.error('Pin scheduler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};
