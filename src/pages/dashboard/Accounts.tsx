import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { getPinterestAuthUrl, exchangePinterestCode, fetchPinterestBoards } from '@/lib/pinterest';
import { useAccountStore } from '@/lib/store';
import { PinterestAccount } from '@/types/pinterest';
import { toast } from 'sonner';

export function Accounts() {
  const location = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { accounts, selectedAccountId, boards, addAccount, setSelectedAccount, setBoards } = useAccountStore();

  const handleConnectPinterest = async () => {
    try {
      setIsConnecting(true);
      const authUrl = await getPinterestAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Pinterest:', error);
      toast.error('Failed to connect to Pinterest');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      
      if (code) {
        try {
          setIsLoading(true);
          const { token, user } = await exchangePinterestCode(code);
          
          const newAccount: PinterestAccount = {
            id: user.username,
            user,
            token,
            lastRefreshed: Date.now(),
          };
          
          await addAccount(newAccount);
          
          // Fetch boards for the new account
          const boards = await fetchPinterestBoards(token.access_token);
          await setBoards(newAccount.id, boards);
          
          // Clear the URL
          window.history.replaceState({}, '', '/dashboard/accounts');
          toast.success('Pinterest account connected successfully!');
        } catch (error) {
          console.error('Error handling Pinterest callback:', error);
          toast.error('Failed to connect Pinterest account');
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pinterest Accounts</h1>
        <Button
          onClick={handleConnectPinterest}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Pinterest Account'}
        </Button>
      </div>

      {accounts?.length > 0 ? (
        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.user.username}
                </option>
              ))}
            </select>
          </div>

          {selectedAccountId && boards?.[selectedAccountId] && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium">Boards</h2>
              </div>
              <div className="divide-y">
                {boards[selectedAccountId].map((board) => (
                  <div key={board.id} className="p-6 flex items-center space-x-4">
                    {board.image_thumbnail_url && (
                      <img
                        src={board.image_thumbnail_url}
                        alt={board.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{board.name}</h3>
                      {board.description && (
                        <p className="text-sm text-gray-500">{board.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500">
            No Pinterest accounts connected yet.
            Connect your first account to get started!
          </div>
        </div>
      )}
    </div>
  );
}
