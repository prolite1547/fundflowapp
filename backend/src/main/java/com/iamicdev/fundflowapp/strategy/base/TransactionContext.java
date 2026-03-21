package com.iamicdev.fundflowapp.strategy.base;

import com.iamicdev.fundflowapp.model.Account;
import com.iamicdev.fundflowapp.model.TransactionType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransactionContext {
    private final TransactionType type;
    private final Account sourceAccount;
    private final Account destinationAccount;
    private final Double amount;
}