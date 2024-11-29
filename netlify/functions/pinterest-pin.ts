import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

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
      console.error('Missing Pinterest credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
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

        console.log('Fetching boards with token:', accessToken.substring(0, 10) + '...');
        
        const response = await fetch(`${PINTEREST_API_URL}/boards`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Pinterest boards error:', {
            status: response.status,
            statusText: response.statusText,
            data
          });
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
        const redirectUri = `${event.headers.origin}/callback`;
        
        if (!code && !refresh_token) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Code or refresh token required' }) 
          };
        }

        console.log('Token exchange params:', {
          grantType: refresh_token ? 'refresh_token' : 'authorization_code',
          code: code ? `${code.substring(0, 10)}...` : undefined,
          refreshToken: refresh_token ? `${refresh_token.substring(0, 10)}...` : undefined,
          redirectUri
        });

        const tokenResponse = await fetch(`${PINTEREST_API_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: refresh_token ? 'refresh_token' : 'authorization_code',
            ...(code ? { 
              code,
              redirect_uri: redirectUri
            } : { 
              refresh_token 
            }),
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          console.error('Pinterest token error:', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: tokenData
          });
          throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed');
        }

        console.log('Token exchange successful');

        if (code) {
          console.log('Fetching user data with new token');
          
          const userResponse = await fetch(`${PINTEREST_API_URL}/user_account`, {
            headers: { 
              'Authorization': `Bearer ${tokenData.access_token}` 
            },
          });

          const userData = await userResponse.json();
          
          if (!userResponse.ok) {
            console.error('Pinterest user error:', {
              status: userResponse.status,
              statusText: userResponse.statusText,
              error: userData
            });
            throw new Error(userData.message || 'Failed to fetch user data');
          }

          console.log('User data fetched successfully');

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
