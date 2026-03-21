package com.iamicdev.fundflowapp.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class DailyTrendResponse {
    private String date;
    private double income;
    private double expense;
    private double investment;
    private double net;
}
