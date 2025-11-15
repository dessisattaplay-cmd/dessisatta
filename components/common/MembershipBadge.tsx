import React from 'react';
import type { MembershipTier } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { Star, Shield, Gem, Diamond } from 'lucide-react';

interface MembershipBadgeProps {
  tier: MembershipTier;
  size?: 'sm' | 'md';
}

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ tier, size = 'md' }) => {
  const { t } = useLocalization();

  if (tier === 'none') return null;

  const tierStyles: Record<MembershipTier, { bg: string, text: string, icon: React.ReactNode }> = {
    none: { bg: '', text: '', icon: null },
    silver: { bg: 'bg-gradient-to-br from-slate-300 to-gray-400', text: 'text-black', icon: <Star /> },
    gold: { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', text: 'text-black', icon: <Shield /> },
    platinum: { bg: 'bg-gradient-to-br from-cyan-300 to-blue-500', text: 'text-white', icon: <Gem /> },
    diamond: { bg: 'bg-gradient-to-br from-purple-400 to-indigo-600', text: 'text-white', icon: <Diamond /> },
  };

  const style = tierStyles[tier];
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';
  
  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-bold rounded-full ${sizeClasses} ${style.bg} ${style.text}`}
      title={t(`tier_${tier}`)}
    >
      {React.cloneElement(style.icon as React.ReactElement, { size: iconSize })}
      <span>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
    </span>
  );
};

export default MembershipBadge;