package com.iamicdev.fundflowapp.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CategoryResponse {
    private String id;
    private String userId;
    private String name;
    private String type;
    private String icon;
    private String color;
}