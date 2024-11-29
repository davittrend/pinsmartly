import { Handler } from '@netlify/functions';
import {
  exchangeCodeForToken,
  refreshToken,
  fetchUserAccount,
  fetchBoards,
} from './utils/pinterest-api';

const clientId = process.env.PINTEREST_CLIENT_ID;
const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

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
      console.error('Missing Pinterest credentials');
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

        console.log('Fetching boards...');
        const boards = await fetchBoards(accessToken);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(boards),
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

        console.log('Processing token request:', {
          hasCode: !!code,
          hasRefreshToken: !!refresh_token,
        });

        if (code) {
          const token = await exchangeCodeForToken(code, redirectUri, clientId, clientSecret);
          const user = await fetchUserAccount(token.access_token);

          console.log('Authentication successful');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ token, user }),
          };
        }

        if (refresh_token) {
          const token = await refreshToken(refresh_token, clientId, clientSecret);
          console.log('Token refresh successful');
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ token }),
          };
        }
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
