package com.iamicdev.fundflowapp.dto.request;

import java.util.UUID;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;


@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateBudgetRequest {
    @NotNull
    private UUID categoryId;

    @NotNull(message = "Limit amount is required")
    private Double limitAmount;

    @NotNull
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private int month;

    @NotNull
    private int year;
}