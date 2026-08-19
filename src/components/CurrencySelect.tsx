import React from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

export interface CurrencySelectOption {
  id: string;
  name: string;
  code: string;
}

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  currencies: CurrencySelectOption[];
  excludeId?: string;
  accent?: 'default' | 'secondary';
}

const CURRENCY_ICONS: Record<string, { emoji: string; isUsdt?: boolean }> = {
  VES: { emoji: '🇻🇪' },
  USD_B: { emoji: '🇺🇸' },
  EUR: { emoji: '🇪🇺' },
  USDT: { emoji: '₮', isUsdt: true },
};

const CurrencyIcon: React.FC<{ id: string }> = ({ id }) => {
  const icon = CURRENCY_ICONS[id];
  if (!icon) return <span className="w-5 h-5" />;
  if (icon.isUsdt) {
    return (
      <span className="w-5 h-5 rounded-full bg-[#26A17B]/15 text-[#26A17B] text-[10px] font-bold flex items-center justify-center border border-[#26A17B]/20 shrink-0">
        ₮
      </span>
    );
  }
  return <span className="text-base leading-none shrink-0">{icon.emoji}</span>;
};

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  currencies,
  excludeId,
  accent = 'default',
}) => {
  const options = currencies.filter(c => c.id !== excludeId);
  const selected = options.find(c => c.id === value) || options[0];

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button
          className={`flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer hover:border-primary/30 transition-all ${
            accent === 'secondary' ? 'text-secondary' : 'text-slate-300'
          }`}
        >
          {selected && <CurrencyIcon id={selected.id} />}
          <span className="whitespace-nowrap">{selected?.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </Listbox.Button>

        <Listbox.Options
          transition
          className="absolute z-30 mt-2 w-full min-w-[180px] bg-[#12152a]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl py-1.5 shadow-2xl overflow-hidden origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {options.map(opt => {
            const isSelected = opt.id === selected?.id;
            return (
              <Listbox.Option
                key={opt.id}
                value={opt.id}
                className={({ active }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-slate-300'
                  }`
                }
              >
                <CurrencyIcon id={opt.id} />
                <span className="flex-1 whitespace-nowrap">{opt.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </Listbox.Option>
            );
          })}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};
