'use client';

import { useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { API_URL } from '../config/config';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Transaction {
  _id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'expiry';
  description: string;
  created_at: string;
}

interface CreditTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditTransactionsModal({ isOpen, onClose }: CreditTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'consumed' | 'purchase' | 'obtained'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, activeTab]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/credits/transactions?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseCredits = () => {
    onClose();
    router.push('/pricing#credits');
  };

  if (!isOpen) return null;

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-[#40a02b]' : 'text-red-500';
  };

  const filteredTransactions = transactions.filter(transaction => {
    switch (activeTab) {
      case 'consumed':
        return transaction.amount < 0;
      case 'purchase':
        return transaction.transaction_type === 'purchase';
      case 'obtained':
        return transaction.amount > 0;
      default:
        return true;
    }
  });

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        style={{ zIndex: 99999 }}
        onClick={onClose}
      />
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl" 
        style={{ zIndex: 100000 }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl mx-4">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-600 to-pink-600">
            <h2 className="text-xl font-semibold text-white">Credit History</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <IoMdClose className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'consumed', label: 'Consumed' },
                { id: 'purchase', label: 'Purchase' },
                { id: 'obtained', label: 'Obtained' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-full text-sm transition-all flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(transaction.created_at), 'dd/MM/yyyy, HH:mm:ss')}
                      </div>
                    </div>
                    <div className={`font-bold ${getTransactionColor(transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              The costs of generation can vary due to factors like quantity, style and length.
            </div>
            <button
              onClick={handlePurchaseCredits}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              Purchase Credits
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #B146D7;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9935C0;
        }
      `}</style>
    </>
  );
} 