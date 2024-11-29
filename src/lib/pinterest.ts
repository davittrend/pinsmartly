import { auth } from './firebase';
import type { PinterestBoard, PinterestToken, PinterestUser, ScheduledPin } from '@/types/pinterest';

const CLIENT_ID = '1507772';
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/callback`
  : '';

const PINTEREST_API_URL = 'https://api-sandbox.pinterest.com/v5';

export async function getPinterestAuthUrl() {
  const scope = 'boards:read,pins:read,pins:write,user_accounts:read,boards:write';
  const state = 'sandbox';
  const redirectUri = encodeURIComponent(REDIRECT_URI);
  return `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
}

export async function exchangePinterestCode(code: string): Promise<{ token: PinterestToken; user: PinterestUser }> {
  console.log('Exchanging code for token...');
  const response = await fetch(`/.netlify/functions/pinterest?path=/token&code=${code}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Token exchange error:', data);
    throw new Error(data.error || 'Failed to exchange Pinterest code');
  }

  return data;
}

export async function refreshPinterestToken(refreshToken: string): Promise<PinterestToken> {
  console.log('Refreshing token...');
  const response = await fetch(`/.netlify/functions/pinterest?path=/token&refresh_token=${refreshToken}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Token refresh error:', data);
    throw new Error(data.error || 'Failed to refresh Pinterest token');
  }

  return data.token;
}

export async function fetchPinterestBoards(accessToken: string): Promise<PinterestBoard[]> {
  console.log('Fetching Pinterest boards...');
  const response = await fetch(`/.netlify/functions/pinterest?path=/boards`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Boards fetch error:', data);
    throw new Error(data.error || 'Failed to fetch Pinterest boards');
  }

  return data;
}

export async function schedulePin(pin: ScheduledPin): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const response = await fetch('/.netlify/functions/pin-scheduler', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userId}`,
      'Origin': window.location.origin,
    },
    body: JSON.stringify([pin]),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Pin scheduling error:', data);
    throw new Error(data.error || 'Failed to schedule pin');
  }
}
