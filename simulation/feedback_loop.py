import pandas as pd
import numpy as np
import uuid
import logging

class AuditLog:
    def write(self, event, details):
        logging.info(f"AUDIT {event}: {details}")

class ExecutionEngine:
    def close_all_positions(self, strategy_id):
        logging.info(f"EXECUTION: Closed all positions for {strategy_id}")

audit_log = AuditLog()
execution_engine = ExecutionEngine()

class FeedbackLoop:
    def __init__(self, predicted_returns: pd.Series):
        self.predicted_returns = predicted_returns
        self.strategy_status = {}
        
    def record_live_performance(self, strategy_id: uuid.UUID, actual_returns: pd.Series):
        df = pd.DataFrame({'actual': actual_returns, 'pred': self.predicted_returns}).dropna()
        if len(df) == 0:
            return {}
            
        prediction_error = df['actual'] - df['pred']
        mean_error = prediction_error.mean()
        
        overfitting_flag = abs(mean_error) > 0.02
        regime_mismatch_flag = False 
        
        return {
            'mean_error': float(mean_error),
            'overfitting_flag': bool(overfitting_flag),
            'regime_mismatch_flag': bool(regime_mismatch_flag)
        }

    def trigger_model_update(self, strategy_id: uuid.UUID, performance_data: dict):
        sharpe_60d = performance_data.get('sharpe_60d', 1.0)
        days_live = performance_data.get('days_live', 0)
        
        if sharpe_60d < 0.5 and days_live > 30:
            audit_log.write("model_update_queued", {"strategy_id": str(strategy_id), "reason": "Sharpe < 0.5"})
            return True
        return False

    def retire_strategy(self, strategy_id: uuid.UUID, performance_data: dict):
        sharpe_90d = performance_data.get('sharpe_90d', 1.0)
        max_drawdown = performance_data.get('max_drawdown', 0.0)
        
        if sharpe_90d < 0 or max_drawdown < -0.20:
            self.strategy_status[strategy_id] = 'retired'
            execution_engine.close_all_positions(strategy_id)
            reason = "Sharpe < 0" if sharpe_90d < 0 else "Drawdown > 20%"
            audit_log.write("strategy_retired", {"strategy_id": str(strategy_id), "reason": reason})
            return True
        return False
