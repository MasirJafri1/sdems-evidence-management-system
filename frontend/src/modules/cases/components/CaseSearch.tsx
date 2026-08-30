import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

interface CaseSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const CaseSearch: React.FC<CaseSearchProps> = ({ value, onChange }) => {
  return (
    <div className="w-full max-w-sm">
      <Input
        placeholder="Filter by Case ID, reference, title, officer..."
        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
