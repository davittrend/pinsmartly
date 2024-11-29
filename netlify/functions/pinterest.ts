import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const PINTEREST_API_URL = process.env.PINTEREST_API_URL || 'https://api-sandbox.pinterest.com/v5';
const CLIENT_ID = process.env.PINTEREST_CLIENT_ID;
const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET;

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Pinterest credentials not configured');
    }

    if (event.httpMethod === 'POST') {
      const { code, refreshToken, redirectUri } = JSON.parse(event.body || '{}');

      // Handle token exchange
      if (code && redirectUri) {
        console.log('Exchanging code for token...', { redirectUri });
        
        const tokenResponse = await fetch(`${PINTEREST_API_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          console.error('Token exchange failed:', tokenData);
          throw new Error(tokenData.error_description || 'Token exchange failed');
        }

        // Fetch user data
        const userResponse = await fetch(`${PINTEREST_API_URL}/user_account`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();
        
        if (!userResponse.ok) {
          console.error('User data fetch failed:', userData);
          throw new Error(userData.message || 'Failed to fetch user data');
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            token: tokenData,
            user: userData,
          }),
        };
      }

      // Handle token refresh
      if (refreshToken) {
        const response = await fetch(`${PINTEREST_API_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }).toString(),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Token refresh failed:', data);
          throw new Error(data.error_description || 'Token refresh failed');
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data),
        };
      }
    }

    // Handle board fetching
    if (event.path.endsWith('/boards')) {
      const accessToken = event.headers.authorization?.replace('Bearer ', '');
      if (!accessToken) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'No access token provided' }),
        };
      }

      const response = await fetch(`${PINTEREST_API_URL}/boards`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Boards fetch failed:', data);
        throw new Error(data.message || 'Failed to fetch boards');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.items || []),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Pinterest API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
