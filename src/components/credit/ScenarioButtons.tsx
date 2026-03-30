import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditRiskInputs, DEFAULT_INPUTS } from '@/lib/creditRisk';
import { TrendDown, TrendUp, Flash, MoneyRecive, RefreshCircle } from 'iconsax-react';

interface ScenarioButtonsProps {
  inputs: CreditRiskInputs;
  onApplyScenario: (newInputs: CreditRiskInputs) => void;
}

export function ScenarioButtons({ inputs, onApplyScenario }: ScenarioButtonsProps) {
  const scenarios = [
    {
      label: "Debt Paydown",
      description: "-20% debt",
      icon: TrendDown,
      apply: () => ({
        ...inputs,
        totalDebt: inputs.totalDebt * 0.8,
        shortTermDebt: inputs.shortTermDebt * 0.8,
        longTermDebt: inputs.longTermDebt * 0.8,
        interestExpense: inputs.interestExpense * 0.8,
      }),
    },
    {
      label: "Revenue Growth",
      description: "+30% market cap",
      icon: TrendUp,
      apply: () => ({
        ...inputs,
        marketCap: inputs.marketCap * 1.3,
        sharePrice: inputs.sharePrice * 1.3,
      }),
    },
    {
      label: "Market Stress",
      description: "+50% volatility",
      icon: Flash,
      apply: () => ({
        ...inputs,
        priceVolatility1Y: inputs.priceVolatility1Y * 1.5,
      }),
    },
    {
      label: "Cash Boost",
      description: "+50% CFO",
      icon: MoneyRecive,
      apply: () => ({
        ...inputs,
        adjCFO: inputs.adjCFO * 1.5,
      }),
    },
    {
      label: "Reset",
      description: "Default values",
      icon: RefreshCircle,
      apply: () => DEFAULT_INPUTS,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs text-muted-foreground mr-2 self-center">What-If:</span>
      {scenarios.map((scenario) => {
        const Icon = scenario.icon;
        return (
          <Button
            key={scenario.label}
            variant="outline"
            size="sm"
            className="text-xs border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 gap-1.5 h-7"
            onClick={() => onApplyScenario(scenario.apply())}
          >
            <Icon size={14} className="text-amber-500" />
            <span>{scenario.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
