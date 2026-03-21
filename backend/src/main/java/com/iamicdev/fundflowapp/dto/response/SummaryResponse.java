package com.iamicdev.fundflowapp.dto.response;

import lombok.*;
import com.iamicdev.fundflowapp.model.ReportPeriod;

@Getter
@Setter
@Builder
public class SummaryResponse {
    private ReportPeriod period;
    private String start;
    private String end;
    private double totalIncome;
    private double totalExpense;
    private double totalInvestment;
    private double netSavings;
    private double savingsRate;
}