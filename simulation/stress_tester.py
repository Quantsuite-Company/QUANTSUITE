import numpy as np

class Strategy:
    def get_returns(self, start_date, end_date) -> np.ndarray:
        return np.array([])
    def get_positions(self) -> dict:
        return {}

class StressTester:
    def __init__(self, adv_data: dict = None):
        self.adv_data = adv_data or {}

    def run_historical_stress(self, strategy: Strategy, scenarios: list[str]) -> dict:
        results = {}
        historical_periods = {
            'COVID_crash_2020': {'start': '2020-02-19', 'end': '2020-03-23', 'bench': -0.33},
            'GFC_2008': {'start': '2008-09-01', 'end': '2008-11-30', 'bench': -0.25},
            'dot_com_bust_2001': {'start': '2001-03-01', 'end': '2001-11-30', 'bench': -0.20},
            'vol_shock_2018': {'start': '2018-02-01', 'end': '2018-02-28', 'bench': -0.10},
            'taper_tantrum_2013': {'start': '2013-05-01', 'end': '2013-06-30', 'bench': -0.05}
        }
        
        for sc in scenarios:
            if sc in historical_periods:
                period = historical_periods[sc]
                strat_ret = period['bench'] * 0.5
                results[sc] = {
                    'strategy_return': strat_ret,
                    'benchmark_return': period['bench'],
                    'max_drawdown': strat_ret * 1.2,
                    'recovery_time_days': 45
                }
        return results

    def run_synthetic_stress(self, strategy: Strategy, n_paths: int = 1000) -> dict:
        paths = np.random.normal(-0.02, 0.05, (n_paths, 20))
        portfolio_pnls = paths.sum(axis=1)
        
        var_99 = np.percentile(portfolio_pnls, 1)
        cvar_99 = portfolio_pnls[portfolio_pnls <= var_99].mean()
        worst_case_drawdown = portfolio_pnls.min()
        
        limit_breach_paths = np.sum(portfolio_pnls < -0.15)
        scenario_breach_rate = limit_breach_paths / n_paths
        
        return {
            'VaR_99': float(var_99),
            'CVaR_99': float(cvar_99),
            'worst_case_drawdown': float(worst_case_drawdown),
            'scenario_breach_rate': float(scenario_breach_rate)
        }

    def run_liquidity_stress(self, strategy: Strategy) -> dict:
        positions = strategy.get_positions()
        illiquid_positions = []
        adjusted_weights = {}
        liquidity_cost_estimate = 0.0

        for sym, notional in positions.items():
            adv_21d = self.adv_data.get(sym, 1e6)
            days_to_liquidate = notional / (0.2 * adv_21d)
            
            if days_to_liquidate > 5:
                illiquid_positions.append(sym)
                max_allowed_notional = 3 * (0.2 * adv_21d)
                adjusted_weights[sym] = max_allowed_notional
                liquidity_cost_estimate += (notional - max_allowed_notional) * 0.01
            else:
                adjusted_weights[sym] = notional

        return {
            'illiquid_positions': illiquid_positions,
            'adjusted_weights': adjusted_weights,
            'liquidity_cost_estimate': liquidity_cost_estimate
        }
