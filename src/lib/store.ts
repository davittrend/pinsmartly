import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PinterestAccount, PinterestBoard } from '@/types/pinterest';

interface AccountStore {
  accounts: PinterestAccount[];
  selectedAccountId: string | null;
  boards: Record<string, PinterestBoard[]>;
  initialized: boolean;
  addAccount: (account: PinterestAccount) => void;
  removeAccount: (accountId: string) => void;
  setSelectedAccount: (accountId: string) => void;
  setBoards: (accountId: string, boards: PinterestBoard[]) => void;
  getAccount: (accountId: string) => PinterestAccount | undefined;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      boards: {},
      initialized: true,

      addAccount: (account) => {
        set((state) => {
          const existingAccounts = state.accounts || [];
          const existingAccount = existingAccounts.find(a => a.id === account.id);
          
          if (existingAccount) {
            return {
              accounts: existingAccounts.map(a => 
                a.id === account.id ? { ...a, ...account } : a
              ),
            };
          } else {
            return {
              accounts: [...existingAccounts, account],
              selectedAccountId: state.selectedAccountId || account.id,
            };
          }
        });
      },

      removeAccount: (accountId) => {
        set((state) => {
          const remainingAccounts = state.accounts.filter(a => a.id !== accountId);
          const newBoards = { ...state.boards };
          delete newBoards[accountId];
          
          return {
            accounts: remainingAccounts,
            selectedAccountId:
              state.selectedAccountId === accountId
                ? remainingAccounts[0]?.id || null
                : state.selectedAccountId,
            boards: newBoards,
          };
        });
      },

      setSelectedAccount: (accountId) => {
        set({ selectedAccountId: accountId });
      },

      setBoards: (accountId, boards) => {
        set((state) => ({
          boards: {
            ...state.boards,
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
