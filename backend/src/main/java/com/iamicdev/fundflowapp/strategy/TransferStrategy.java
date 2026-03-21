package com.iamicdev.fundflowapp.strategy;

import org.springframework.stereotype.Service;

import com.iamicdev.fundflowapp.model.Account;
import com.iamicdev.fundflowapp.strategy.base.TransactionContext;
import com.iamicdev.fundflowapp.strategy.base.TransactionStrategy;

@Service("TRANSFER")
public class TransferStrategy implements TransactionStrategy {
    @Override
    public void apply(TransactionContext context) {
        Account sourceAccount = context.getSourceAccount();
        Account destinationAccount = context.getDestinationAccount();
        double amount = context.getAmount();

        if(destinationAccount == null) throw new IllegalStateException("Destination account required for TRANSFER");
        if(sourceAccount == null) throw new IllegalStateException("Source account required for TRANSFER");

        sourceAccount.setBalance(sourceAccount.getBalance() - amount);
        destinationAccount.setBalance(destinationAccount.getBalance() + amount);
    }
}