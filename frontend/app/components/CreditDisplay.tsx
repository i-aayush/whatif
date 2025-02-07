'use client';

import { FaCoins } from 'react-icons/fa';
import { useModal } from '../providers/ModalProvider';

interface CreditDisplayProps {
  credits?: number;
}

export default function CreditDisplay({ credits = 0 }: CreditDisplayProps) {
  const { openCreditHistory } = useModal();

  return (
    <div 
      className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors"
      onClick={openCreditHistory}
    >
      <FaCoins className="w-4 h-4 text-yellow-600" />
      <span className="text-sm font-medium">{credits}</span>
    </div>
  );
} 