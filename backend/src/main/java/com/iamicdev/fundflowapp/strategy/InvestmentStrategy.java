package com.iamicdev.fundflowapp.strategy;

import org.springframework.stereotype.Service;

import com.iamicdev.fundflowapp.strategy.base.TransactionContext;
import com.iamicdev.fundflowapp.strategy.base.TransactionStrategy;

@Service("INVESTMENT")
public class InvestmentStrategy implements TransactionStrategy {
    @Override
    public void apply(TransactionContext context) {
        context.getSourceAccount().setBalance(context.getSourceAccount().getBalance() - context.getAmount());
    }
}