package com.iamicdev.fundflowapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateAccountRequest {
    @NotBlank(message="Account name is required")
    private String name;

    @NotBlank(message="Account type is required")
    private String type;

    @Builder.Default
    private Double initialBalance = 0.0;
}