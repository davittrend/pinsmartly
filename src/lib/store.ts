import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, set, get, child } from 'firebase/database';
import { database } from './firebase';
import type { PinterestAccount, PinterestBoard } from '@/types/pinterest';

interface AccountStore {
  accounts: PinterestAccount[];
  selectedAccountId: string | null;
  boards: Record<string, PinterestBoard[]>;
  addAccount: (account: PinterestAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  setSelectedAccount: (accountId: string) => void;
  setBoards: (accountId: string, boards: PinterestBoard[]) => Promise<void>;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      boards: {},
      addAccount: async (account) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Save to Firebase
        await set(ref(database, `users/${userId}/accounts/${account.id}`), account);
        
        set((state) => ({
          accounts: [...state.accounts, account],
          selectedAccountId: state.selectedAccountId || account.id,
        }));
      },
      removeAccount: async (accountId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Remove from Firebase
        await set(ref(database, `users/${userId}/accounts/${accountId}`), null);
        
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== accountId),
          selectedAccountId:
            state.selectedAccountId === accountId
              ? state.accounts[0]?.id || null
              : state.selectedAccountId,
          boards: {
            ...state.boards,
            [accountId]: undefined,
          },
        }));
      },
      setSelectedAccount: (accountId) =>
        set({ selectedAccountId: accountId }),
      setBoards: async (accountId, boards) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Save to Firebase
        await set(ref(database, `users/${userId}/boards/${accountId}`), boards);
        
        set((state) => ({
          boards: {
            ...state.boards,
            [accountId]: boards,
          },
        }));
      },
    }),
    {
      name: 'pinterest-accounts',
    }
  )
);