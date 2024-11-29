import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ref, set, get, onValue, off } from 'firebase/database';
import { database, auth } from './firebase';
import type { PinterestAccount, PinterestBoard } from '@/types/pinterest';

interface AccountStore {
  accounts: PinterestAccount[];
  selectedAccountId: string | null;
  boards: Record<string, PinterestBoard[]>;
  initialized: boolean;
  addAccount: (account: PinterestAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  setSelectedAccount: (accountId: string) => void;
  setBoards: (accountId: string, boards: PinterestBoard[]) => Promise<void>;
  getAccount: (accountId: string) => PinterestAccount | undefined;
  initializeAccountListener: () => () => void; // Returns cleanup function
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      boards: {},
      initialized: false,

      initializeAccountListener: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.warn('No user ID available for account listener');
          return () => {};
        }

        console.log('Initializing account listeners for user:', userId);

        const accountsRef = ref(database, `users/${userId}/accounts`);
        const boardsRef = ref(database, `users/${userId}/boards`);

        // Set up accounts listener
        const accountsCallback = onValue(accountsRef, (snapshot) => {
          const accounts = snapshot.val();
          console.log('Accounts updated:', accounts);
          
          if (accounts) {
            const accountsList = Object.values(accounts) as PinterestAccount[];
            set((state) => ({ 
              accounts: accountsList,
              selectedAccountId: state.selectedAccountId || accountsList[0]?.id,
              initialized: true
            }));
          } else {
            set({ accounts: [], initialized: true });
          }
        }, (error) => {
          console.error('Error in accounts listener:', error);
          set({ initialized: true });
        });

        // Set up boards listener
        const boardsCallback = onValue(boardsRef, (snapshot) => {
          const boards = snapshot.val();
          console.log('Boards updated:', boards);
          
          if (boards) {
            set({ boards });
          }
        }, (error) => {
          console.error('Error in boards listener:', error);
        });

        // Return cleanup function
        return () => {
          off(accountsRef, 'value', accountsCallback);
          off(boardsRef, 'value', boardsCallback);
        };
      },

      addAccount: async (account) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        try {
          await set(ref(database, `users/${userId}/accounts/${account.id}`), account);
          console.log('Account added successfully:', account.id);
        } catch (error) {
          console.error('Error adding account:', error);
          throw new Error('Failed to add account');
        }
      },

      removeAccount: async (accountId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        try {
          await set(ref(database, `users/${userId}/accounts/${accountId}`), null);
          await set(ref(database, `users/${userId}/boards/${accountId}`), null);
          
          set((state) => {
            const remainingAccounts = state.accounts.filter(a => a.id !== accountId);
            return {
              accounts: remainingAccounts,
              selectedAccountId:
                state.selectedAccountId === accountId
                  ? remainingAccounts[0]?.id || null
                  : state.selectedAccountId,
              boards: {
                ...state.boards,
                [accountId]: undefined,
              },
            };
          });
          console.log('Account removed successfully:', accountId);
        } catch (error) {
          console.error('Error removing account:', error);
          throw new Error('Failed to remove account');
        }
      },

      setSelectedAccount: (accountId) => {
        console.log('Setting selected account:', accountId);
        set({ selectedAccountId: accountId });
      },

      setBoards: async (accountId, boards) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        try {
          await set(ref(database, `users/${userId}/boards/${accountId}`), boards);
          console.log('Boards updated successfully for account:', accountId);
        } catch (error) {
          console.error('Error setting boards:', error);
          throw new Error('Failed to update boards');
        }
      },

      getAccount: (accountId) => {
        return get().accounts?.find(a => a.id === accountId);
      },
    }),
    {
      name: 'pinterest-accounts',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('Store rehydrated:', state);
      },
    }
  )
);
