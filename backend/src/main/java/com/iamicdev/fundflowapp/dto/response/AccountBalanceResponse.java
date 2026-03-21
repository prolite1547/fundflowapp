package com.iamicdev.fundflowapp.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AccountBalanceResponse {
    private String accountId;
    private String accountName;
    private double balance;
}