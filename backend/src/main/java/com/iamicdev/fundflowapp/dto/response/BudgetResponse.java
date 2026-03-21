package com.iamicdev.fundflowapp.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class BudgetResponse {
    private String id;
    private String userId;
    private String categoryId;
    private Double limitAmount;
    private int month;
    private int year;
    private Double spentAmount;
    private Double remainingAmount;
    private String categoryName;
}
