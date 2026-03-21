package com.iamicdev.fundflowapp.dto.response;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TransactionResponse {
    private String id;
    private String accountId;
    private String categoryId;
    private Double amount;
    private Instant date;
    private String type;
    private String description;
    private String accountName;
    private String categoryName;
}