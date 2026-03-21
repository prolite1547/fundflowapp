package com.iamicdev.fundflowapp.dto;

public record SummaryArg(
    double totalIncome,
    double totalExpense,
    double totalInvestment
) {}