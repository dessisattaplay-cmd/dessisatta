import React from 'react';
import type { BaziResult } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';

const HistoryCard: React.FC<{ result: BaziResult }> = ({ result }) => {
  const { t } = useLocalization();
  return (
    <div className="bg-black/40 border-2 border-amber-800/50 rounded-lg p-4 transition-transform hover:scale-105 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-cinzel text-lg text-yellow-400">{t('baziNo')} {result.baziNumber}</p>
          <p className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleString()}</p>
        </div>
        <div className="w-16 h-16 flex items-center justify-center text-4xl font-bold font-teko text-black bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full">
          {result.finalDigit}
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-2 font-teko">Numbers: {result.numbers.join(' + ')} = {result.total}</p>
    </div>
  );
}

export default HistoryCard;
