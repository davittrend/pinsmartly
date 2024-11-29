import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangePinterestCode, fetchPinterestBoards } from '@/lib/pinterest';
import { useAccountStore } from '@/lib/store';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase'; // Add this import

export function PinterestCallback() {
  const navigate = useNavigate();
  const { addAccount, setBoards } = useAccountStore();

  useEffect(() => {
    const handleCallback = async () => {
      // Check if user is authenticated
      if (!auth.currentUser) {
        toast.error('Please sign in first');
        navigate('/signin');
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      if (!code) {
        toast.error('No authorization code received');
        navigate('/dashboard/accounts');
        return;
      }

      try {
        const { token, user } = await exchangePinterestCode(code);

        const newAccount = {
          id: user.username,
          user,
          token,
          lastRefreshed: Date.now(),
        };

        await addAccount(newAccount);

        // Fetch boards immediately after adding account
        const boards = await fetchPinterestBoards(token.access_token);
        await setBoards(newAccount.id, boards);

        toast.success('Pinterest account connected successfully!');
        navigate('/dashboard/accounts');
      } catch (error) {
        console.error('Error handling Pinterest callback:', error);
        toast.error('Failed to connect Pinterest account');
        navigate('/dashboard/accounts');
      }
    };

    handleCallback();
  }, [navigate, addAccount, setBoards]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
    </div>
  );
}
