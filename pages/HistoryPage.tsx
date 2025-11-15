import React, { useState, useMemo, useEffect } from 'react';
import { getHistory } from '../services/baziService';
import type { BaziResult } from '../types';
import HistoryCard from '../components/bazi/HistoryCard';
import { useLocalization } from '../hooks/useLocalization';

const HistoryPage: React.FC = () => {
  const { t } = useLocalization();
  const [allResults, setAllResults] = useState<BaziResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setAllResults(getHistory());
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return allResults;
    return allResults.filter(result => 
      result.baziNumber.toString().includes(searchTerm) ||
      result.finalDigit.toString().includes(searchTerm)
    );
  }, [searchTerm, allResults]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-cinzel text-yellow-400">{t('resultHistory')}</h1>
        <p className="text-gray-400 mt-2">{t('historySubtitle')}</p>
      </div>
      <div className="max-w-md mx-auto">
        <input 
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black bg-opacity-50 border-2 border-amber-500 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>
      {filteredResults.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredResults.map(result => (
            <HistoryCard key={result.id} result={result} />
          ))}
        </div>
      ) : (
        <p className="col-span-full text-center text-gray-500 py-10">{t('noResultsFound')}</p>
      )}
    </div>
  );
};

export default HistoryPage;
