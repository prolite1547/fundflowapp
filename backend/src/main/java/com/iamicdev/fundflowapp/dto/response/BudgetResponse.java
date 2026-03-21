package com.iamicdev.fundflowapp.dto.response;

import lombok.*;


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