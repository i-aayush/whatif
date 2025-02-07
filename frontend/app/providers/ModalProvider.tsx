'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import CreditTransactionsModal from '../components/CreditTransactionsModal';

interface ModalContextType {
  openCreditHistory: () => void;
  closeCreditHistory: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isCreditHistoryOpen, setIsCreditHistoryOpen] = useState(false);

  const openCreditHistory = () => setIsCreditHistoryOpen(true);
  const closeCreditHistory = () => setIsCreditHistoryOpen(false);

  return (
    <ModalContext.Provider value={{ openCreditHistory, closeCreditHistory }}>
      {children}
      <CreditTransactionsModal 
        isOpen={isCreditHistoryOpen}
        onClose={closeCreditHistory}
      />
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
} 