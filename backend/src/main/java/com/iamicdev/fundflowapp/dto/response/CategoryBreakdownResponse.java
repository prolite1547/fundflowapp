package com.iamicdev.fundflowapp.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CategoryBreakdownResponse {
    private String categoryId;
    private String categoryName;
    private double totalAmount;
    private double percentage;
}