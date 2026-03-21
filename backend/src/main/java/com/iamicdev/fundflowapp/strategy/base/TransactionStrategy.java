package com.iamicdev.fundflowapp.strategy.base;

public interface TransactionStrategy {
    void apply(TransactionContext context);
}