import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { getPinterestAuthUrl, fetchPinterestBoards } from '@/lib/pinterest';
import { useAccountStore } from '@/lib/store';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

export function Accounts() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const store = useAccountStore((state) => ({
    accounts: state.accounts,
    selectedAccountId: state.selectedAccountId,
    boards: state.boards,
    removeAccount: state.removeAccount,
    setSelectedAccount: state.setSelectedAccount,
    setBoards: state.setBoards,
  }), (prev, next) => {
    // Log state changes
    console.log('Store state changed:', {
      prev,
      next,
      accountsChanged: prev.accounts !== next.accounts,
      selectedAccountChanged: prev.selectedAccountId !== next.selectedAccountId,
      boardsChanged: prev.boards !== next.boards,
    });
    return false; // Always update
  });

  useEffect(() => {
    console.log('Accounts component mounted');
    console.log('Current accounts:', store.accounts);
    console.log('Selected account ID:', store.selectedAccountId);
    console.log('Boards:', store.boards);
  }, [store.accounts, store.selectedAccountId, store.boards]);

  const handleConnectPinterest = async () => {
    try {
      setIsConnecting(true);
      const authUrl = await getPinterestAuthUrl();
      console.log('Generated Pinterest auth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Pinterest:', error);
      toast.error('Failed to connect to Pinterest');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await store.removeAccount(accountId);
      toast.success('Account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const handleRefreshBoards = async (accountId: string) => {
    try {
      setIsRefreshing(true);
      const account = store.accounts?.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      const boards = await fetchPinterestBoards(account.token.access_token);
      await store.setBoards(accountId, boards);
      toast.success('Boards refreshed successfully');
    } catch (error) {
      console.error('Error refreshing boards:', error);
      toast.error('Failed to refresh boards');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Debug function to check store state
  const debugStoreState = () => {
    console.log('Current store state:', {
      accounts: store.accounts,
      selectedAccountId: store.selectedAccountId,
      boards: store.boards,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pinterest Accounts</h1>
        <div className="flex items-center">
          <Button
            onClick={handleConnectPinterest}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Pinterest Account'}
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              onClick={debugStoreState}
              className="ml-2"
            >
              Debug Store
            </Button>
          )}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <pre>
            {JSON.stringify(
              {
                accountsLength: store.accounts?.length || 0,
                selectedAccountId: store.selectedAccountId,
                hasBoards: !!store.boards && Object.keys(store.boards).length > 0,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {store.accounts?.length > 0 ? (
        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <div className="flex items-center space-x-4">
              <select
                className="flex-1 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
                value={store.selectedAccountId || ''}
                onChange={(e) => store.setSelectedAccount(e.target.value)}
              >
                <option value="">Select an account</option>
                {store.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.user.username}
                  </option>
                ))}
              </select>
              {store.selectedAccountId && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleRefreshBoards(store.selectedAccountId!)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Boards'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnectAccount(store.selectedAccountId!)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>

          {store.selectedAccountId && store.boards?.[store.selectedAccountId] && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium">
                  Boards ({store.boards[store.selectedAccountId].length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {store.boards[store.selectedAccountId].map((board) => (
                  <div key={board.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-3">
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
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Privacy: {board.privacy}
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
