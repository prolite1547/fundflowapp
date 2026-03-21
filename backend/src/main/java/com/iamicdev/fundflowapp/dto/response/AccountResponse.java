package com.iamicdev.fundflowapp.dto.response;
 
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AccountResponse {
    private String id;
    private String name;
    private String type;
    private Double balance;
}