import { Handler } from '@netlify/functions';

const clientId = process.env.PINTEREST_CLIENT_ID;
const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
const PINTEREST_API_URL = 'https://api-sandbox.pinterest.com/v5';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.queryStringParameters?.path;

  try {
    if (!clientId || !clientSecret) {
      throw new Error('Pinterest client credentials not configured');
    }

    switch (path) {
      case '/boards': {
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
          console.error('Pinterest boards error:', data);
          throw new Error(data.message || 'Failed to fetch boards');
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data.items),
        };
      }

      case '/token': {
        const { code, refresh_token } = event.queryStringParameters || {};
        
        if (!code && !refresh_token) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Code or refresh token required' }) 
          };
        }

        const tokenResponse = await fetch(`${PINTEREST_API_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: refresh_token ? 'refresh_token' : 'authorization_code',
            ...(code ? { code, redirect_uri: event.headers.origin + '/callback' } : { refresh_token }),
          }),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          console.error('Pinterest token error:', tokenData);
          throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed');
        }

        if (code) {
          const userResponse = await fetch(`${PINTEREST_API_URL}/user_account`, {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
          });

          const userData = await userResponse.json();
          
          if (!userResponse.ok) {
            console.error('Pinterest user error:', userData);
            throw new Error(userData.message || 'Failed to fetch user data');
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ token: tokenData, user: userData }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ token: tokenData }),
        };
      }

      default:
        return { 
          statusCode: 404, 
          headers, 
          body: JSON.stringify({ error: 'Not found' }) 
        };
    }
  } catch (error) {
    console.error('Pinterest API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
    };
  }
};
