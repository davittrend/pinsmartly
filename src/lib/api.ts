// src/lib/api.ts

import { getAuth } from 'firebase/auth';

export const fetchScheduledPins = async (idToken: string) => {
  try {
    const response = await fetch('/.netlify/functions/pin-scheduler', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch scheduled pins');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduled pins:', error);
    throw error;
  }
};

export const createScheduledPin = async (idToken: string, pinData: any) => {
  try {
    const response = await fetch('/.netlify/functions/pin-scheduler', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create scheduled pin');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating scheduled pin:', error);
    throw error;
  }
};

export const deleteScheduledPin = async (idToken: string, pinId: string) => {
  try {
    const response = await fetch('/.netlify/functions/pin-scheduler', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pinId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete scheduled pin');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting scheduled pin:', error);
    throw error;
  }
};
