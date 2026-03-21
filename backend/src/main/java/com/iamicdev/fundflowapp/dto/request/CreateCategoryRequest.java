package com.iamicdev.fundflowapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {
    @NotBlank(message="Category name is required")
    private String name;

    @NotBlank(message="Category type is required")
    private String type; 

    private String icon;
    private String color;
}