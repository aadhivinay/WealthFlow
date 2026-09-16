import React from 'react';
import { Check, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'PAID' | 'UNPAID';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isPaid = status === 'PAID';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {isPaid ? <Check size={12} /> : <Clock size={12} />}
      {isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );
};

export default StatusBadge;
