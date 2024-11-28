import { auth } from './firebase';
import type { PinterestBoard, PinterestToken, PinterestUser } from '@/types/pinterest';

const PINTEREST_CONFIG = {
  CLIENT_ID: '1507772',
  REDIRECT_URI: typeof window !== 'undefined' 
    ? `${window.location.origin}/callback`
    : process.env.URL 
      ? `${process.env.URL}/callback` 
      : 'http://localhost:5173/callback'
};

export async function getPinterestAuthUrl() {
  const response = await fetch('/.netlify/functions/pinterest?path=/oauth/url');
  if (!response.ok) {
    throw new Error('Failed to get Pinterest auth URL');
  }
  const data = await response.json();
  return data.url;
}

export async function exchangePinterestCode(code: string): Promise<{ token: PinterestToken; user: PinterestUser }> {
  const response = await fetch(`/.netlify/functions/pinterest?path=/token&code=${code}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to exchange Pinterest code');
  }

  return response.json();
}

export async function refreshPinterestToken(refreshToken: string): Promise<PinterestToken> {
  const response = await fetch(`/.netlify/functions/pinterest?path=/token&refresh_token=${refreshToken}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Pinterest token');
  }

  return response.json();
}

export async function fetchPinterestBoards(accessToken: string): Promise<PinterestBoard[]> {
  const response = await fetch('/.netlify/functions/pinterest?path=/boards', {
    headers: {
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Pinterest boards');
  }

  const data = await response.json();
  return data.items;
}
