package com.iamicdev.fundflowapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialHealthResponse {
    private double score;     // 0 to 100
    private String status;    // "Excellent", "Good", "Needs Attention", "Critical"
    private String message;   // Descriptive rationale for the score
    private double savingsRate;
    private double budgetDiscipline;
    private double expenseStability;
    private double emergencyFund;
}
