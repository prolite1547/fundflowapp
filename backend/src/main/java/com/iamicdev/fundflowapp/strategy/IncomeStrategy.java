package com.iamicdev.fundflowapp.strategy;

import org.springframework.stereotype.Service;

import com.iamicdev.fundflowapp.model.Account;
import com.iamicdev.fundflowapp.strategy.base.TransactionContext;
import com.iamicdev.fundflowapp.strategy.base.TransactionStrategy;

@Service("INCOME")
public class IncomeStrategy implements TransactionStrategy {
    @Override
    public void apply(TransactionContext context) {
        context.getSourceAccount().setBalance(context.getSourceAccount().getBalance() + context.getAmount());
    }
}