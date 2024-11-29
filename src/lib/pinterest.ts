import { auth } from './firebase';
import type { PinterestBoard, PinterestToken, PinterestUser, ScheduledPin } from '@/types/pinterest';

const PINTEREST_API_URL = 'https://api-sandbox.pinterest.com/v5';
const CLIENT_ID = '1507772';
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/dashboard/accounts`
  : 'http://localhost:5173/dashboard/accounts';

export async function getPinterestAuthUrl() {
  const scope = 'boards:read,pins:read,pins:write,user_accounts:read,boards:write';
  return `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&state=sandbox`;
}

export async function exchangePinterestCode(code: string): Promise<{ token: PinterestToken; user: PinterestUser }> {
  const response = await fetch(`/.netlify/functions/pinterest?path=/token&code=${code}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange Pinterest code');
  }

  return response.json();
}

export async function refreshPinterestToken(refreshToken: string): Promise<PinterestToken> {
  const response = await fetch(`/.netlify/functions/pinterest?path=/token&refresh_token=${refreshToken}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Pinterest token');
  }

  return response.json();
}

export async function fetchPinterestBoards(accessToken: string): Promise<PinterestBoard[]> {
  const response = await fetch(`${PINTEREST_API_URL}/boards`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch Pinterest boards');
  }

  const data = await response.json();
  return data.items;
}

export async function schedulePin(pin: ScheduledPin): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const response = await fetch('/.netlify/functions/pin-scheduler', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userId}`,
    },
    body: JSON.stringify([pin]),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to schedule pin');
  }
}
