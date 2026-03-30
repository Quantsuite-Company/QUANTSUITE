import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditRiskInputs } from '@/lib/creditRisk';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircle } from 'iconsax-react';

interface CreditInputPanelProps {
  inputs: CreditRiskInputs;
  onChange: (inputs: CreditRiskInputs) => void;
}

interface InputRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  tooltip: string;
  suffix?: string;
  step?: number;
}

function InputRow({ label, value, onChange, tooltip, suffix = '', step = 0.01 }: InputRowProps) {
  const displayValue = value || 0;
  const barWidth = Math.min(100, Math.max(0, (displayValue / (displayValue * 2 || 100)) * 100));
  
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <InfoCircle size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
          <Label className="text-sm text-muted-foreground">{label}</Label>
        </div>
      </div>
      
      <div className="relative">
        {/* Background bar */}
        <div className="absolute inset-0 bg-muted/20 rounded-md overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500/30 to-amber-500/10 transition-all duration-300"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        
        {/* Input */}
        <div className="relative flex items-center">
          <Input
            type="number"
            value={displayValue}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step={step}
            className="bg-transparent border-amber-500/30 text-right pr-12 font-mono text-foreground focus:border-amber-500 focus:ring-amber-500/20"
          />
          <span className="absolute right-3 text-sm text-muted-foreground">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

export function CreditInputPanel({ inputs, onChange }: CreditInputPanelProps) {
  const updateField = (field: keyof CreditRiskInputs, value: number) => {
    onChange({ ...inputs, [field]: value });
  };

  const inputFields: Array<{
    field: keyof CreditRiskInputs;
    label: string;
    tooltip: string;
    suffix: string;
    step?: number;
  }> = [
    {
      field: 'sharePrice',
      label: 'Share Price',
      tooltip: 'Current market price per share',
      suffix: '$',
      step: 0.01,
    },
    {
      field: 'marketCap',
      label: 'Market Cap',
      tooltip: 'Total market capitalization in millions',
      suffix: 'MM',
      step: 0.1,
    },
    {
      field: 'priceVolatility1Y',
      label: 'Price Vol (1-Yr)',
      tooltip: '1-year historical price volatility (e.g., 1.2258 = 122.58%)',
      suffix: '',
      step: 0.01,
    },
    {
      field: 'shortTermDebt',
      label: 'Short-Term Debt',
      tooltip: 'Debt due within 1 year in millions',
      suffix: 'MM',
      step: 0.1,
    },
    {
      field: 'longTermDebt',
      label: 'Long-Term Debt',
      tooltip: 'Debt due after 1 year in millions',
      suffix: 'MM',
      step: 0.1,
    },
    {
      field: 'totalDebt',
      label: 'Total Debt',
      tooltip: 'Sum of all debt obligations in millions',
      suffix: 'MM',
      step: 0.1,
    },
    {
      field: 'interestExpense',
      label: 'Interest Exp (T12M)',
      tooltip: 'Trailing 12-month interest expense in millions',
      suffix: 'MM',
      step: 0.1,
    },
    {
      field: 'adjCFO',
      label: 'Adj CFO',
      tooltip: 'Adjusted Cash From Operations in millions',
      suffix: 'MM',
      step: 0.1,
    },
  ];

  return (
    <div className="space-y-4 p-4 bg-card/50 rounded-lg border border-qs-glass-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wide">
          Model Inputs
        </h3>
        <span className="text-xs text-muted-foreground">All values in USD</span>
      </div>
      
      <div className="space-y-3">
        {inputFields.map((field) => (
          <InputRow
            key={field.field}
            label={field.label}
            value={inputs[field.field] as number}
            onChange={(value) => updateField(field.field, value)}
            tooltip={field.tooltip}
            suffix={field.suffix}
            step={field.step}
          />
        ))}
      </div>
    </div>
  );
}
