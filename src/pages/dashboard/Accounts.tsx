import { useState, useEffect } from 'react';  // Add useEffect
import { Button } from '@/components/ui/Button';
import { getPinterestAuthUrl, fetchPinterestBoards } from '@/lib/pinterest';
import { useAccountStore } from '@/lib/store';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

export function Accounts() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { accounts, selectedAccountId, boards, removeAccount, setSelectedAccount, setBoards } = useAccountStore();

  // Add debug useEffect
  useEffect(() => {
    console.log('Accounts component mounted');
    console.log('Current accounts:', accounts);
    console.log('Selected account ID:', selectedAccountId);
    console.log('Boards:', boards);
  }, [accounts, selectedAccountId, boards]);

  // Modify the existing functions to include debugging
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

  // Add a function to check store state
  const debugStoreState = () => {
    console.log('Current store state:', {
      accounts,
      selectedAccountId,
      boards,
    });
  };

  // Add a button to manually trigger store state check
  const renderDebugButton = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <Button
          variant="outline"
          onClick={debugStoreState}
          className="ml-2"
        >
          Debug Store
        </Button>
      );
    }
    return null;
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
          {renderDebugButton()}
        </div>
      </div>

      {/* Add debug info display in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <pre>
            {JSON.stringify(
              {
                accountsLength: accounts?.length || 0,
                selectedAccountId,
                hasBoards: !!boards && Object.keys(boards).length > 0,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Rest of your component code... */}
    </div>
  );
}
