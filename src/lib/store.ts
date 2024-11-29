import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, set, get } from 'firebase/database';
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

        // Check if account already exists
        const existingAccounts = get().accounts || [];
        const existingAccount = existingAccounts.find(a => a.id === account.id);
        
        if (existingAccount) {
          // Update existing account
          const updatedAccounts = existingAccounts.map(a => 
            a.id === account.id ? { ...a, ...account } : a
          );

          // Save to Firebase
          await set(ref(database, `users/${userId}/accounts/${account.id}`), account);
          
          set({ accounts: updatedAccounts });
        } else {
          // Add new account
          await set(ref(database, `users/${userId}/accounts/${account.id}`), account);
          
          set((state) => ({
            accounts: [...(state.accounts || []), account],
            selectedAccountId: state.selectedAccountId || account.id,
          }));
        }
      },

      removeAccount: async (accountId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Remove from Firebase
        await set(ref(database, `users/${userId}/accounts/${accountId}`), null);
        await set(ref(database, `users/${userId}/boards/${accountId}`), null);
        
        set((state) => {
          const remainingAccounts = (state.accounts || []).filter(a => a.id !== accountId);
          return {
            accounts: remainingAccounts,
            selectedAccountId:
              state.selectedAccountId === accountId
                ? remainingAccounts[0]?.id || null
                : state.selectedAccountId,
            boards: {
              ...(state.boards || {}),
              [accountId]: undefined,
            },
          };
        });
      },

      setSelectedAccount: (accountId) => set({ selectedAccountId: accountId }),

      setBoards: async (accountId, boards) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Save to Firebase
        await set(ref(database, `users/${userId}/boards/${accountId}`), boards);
        
        set((state) => ({
          boards: {
            ...(state.boards || {}),
            [accountId]: boards,
          },
        }));
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
