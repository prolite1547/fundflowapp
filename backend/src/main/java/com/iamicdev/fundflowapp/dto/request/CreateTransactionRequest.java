package com.iamicdev.fundflowapp.dto.request;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransactionRequest {
    @NotNull
    private UUID accountId;

    private UUID destinationAccountId;

    @NotNull
    private UUID categoryId;
    
    @NotNull(message = "Amount is required")
    private Double amount;
    
    @NotBlank(message = "Description is required")
    private String description;

    @Builder.Default
    private Instant date = Instant.now();
    
    @NotBlank(message = "Type is required")
    private String type;  

}