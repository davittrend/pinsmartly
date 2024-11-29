import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, set, get, onValue } from 'firebase/database';
import { database, auth } from './firebase';
import type { PinterestAccount, PinterestBoard } from '@/types/pinterest';

interface AccountStore {
  accounts: PinterestAccount[];
  selectedAccountId: string | null;
  boards: Record<string, PinterestBoard[]>;
  addAccount: (account: PinterestAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  setSelectedAccount: (accountId: string) => void;
  setBoards: (accountId: string, boards: PinterestBoard[]) => Promise<void>;
  getAccount: (accountId: string) => PinterestAccount | undefined;
  initializeAccountListener: () => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      boards: {},

      initializeAccountListener: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const accountsRef = ref(database, `users/${userId}/accounts`);
        onValue(accountsRef, (snapshot) => {
          const accounts = snapshot.val();
          if (accounts) {
            const accountsList = Object.values(accounts) as PinterestAccount[];
            set({ 
              accounts: accountsList,
              selectedAccountId: get().selectedAccountId || accountsList[0]?.id
            });
          }
        });

        const boardsRef = ref(database, `users/${userId}/boards`);
        onValue(boardsRef, (snapshot) => {
          const boards = snapshot.val();
          if (boards) {
            set({ boards });
          }
        });
      },

      addAccount: async (account) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await set(ref(database, `users/${userId}/accounts/${account.id}`), account);
      },

      removeAccount: async (accountId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

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
      },

      setSelectedAccount: (accountId) => set({ selectedAccountId: accountId }),

      setBoards: async (accountId, boards) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await set(ref(database, `users/${userId}/boards/${accountId}`), boards);
      },

      getAccount: (accountId) => {
        return get().accounts?.find(a => a.id === accountId);
      },
    }),
    {
      name: 'pinterest-accounts',
      version: 1,
    }
  )
);
