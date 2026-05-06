import pytest
import pandas as pd
import numpy as np
import uuid
from simulation.backtester import WalkForwardBacktester
from simulation.stress_tester import StressTester, Strategy
from simulation.feedback_loop import FeedbackLoop

class MockModel:
    def fit(self, X, y): pass
    def predict(self, X): return np.ones(len(X)) * 0.01

def mock_factory(): return MockModel()

def test_walk_forward_double_blind():
    dates = pd.date_range('2020-01-01', periods=1000)
    data = pd.DataFrame({'date': dates, 'feat1': np.random.randn(1000), 'target': np.random.randn(1000)})
    
    wb = WalkForwardBacktester(data, train_start='2020-01-01', test_window_days=30, min_train_days=100)
    preds = wb.run(mock_factory, ['feat1'], 'target')
    
    assert len(preds) > 0
    assert not preds.isna().any()

def test_var_cvar_invariant():
    st = StressTester()
    res = st.run_synthetic_stress(Strategy(), n_paths=100)
    assert res['VaR_99'] >= res['CVaR_99']

def test_feedback_overfitting():
    pred = pd.Series([0.05, 0.05, 0.05])
    actual = pd.Series([0.01, 0.01, 0.01])
    fl = FeedbackLoop(pred)
    res = fl.record_live_performance(uuid.uuid4(), actual)
    assert res['overfitting_flag'] == True

def test_retire_strategy():
    fl = FeedbackLoop(pd.Series(dtype=float))
    id = uuid.uuid4()
    fl.retire_strategy(id, {'sharpe_90d': -0.1, 'max_drawdown': -0.10})
    assert fl.strategy_status[id] == 'retired'
