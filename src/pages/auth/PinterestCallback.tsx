import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangePinterestCode, fetchPinterestBoards } from '@/lib/pinterest';
import { useAccountStore } from '@/lib/store';
import type { PinterestAccount } from '@/types/pinterest';
import { toast } from 'sonner';

export function PinterestCallback() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const { addAccount, setBoards } = useAccountStore();

  useEffect(() => {
    const processCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      if (!code) {
        toast.error('Invalid callback URL');
        navigate('/dashboard/accounts');
        return;
      }

      try {
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
        
        toast.success('Pinterest account connected successfully!');
        navigate('/dashboard/accounts');
      } catch (error) {
        console.error('Error processing Pinterest callback:', error);
        toast.error('Failed to connect Pinterest account');
        navigate('/dashboard/accounts');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connecting your Pinterest account...</p>
      </div>
    </div>
  );
}
