package com.iamicdev.fundflowapp.dto;

import java.util.UUID;

public record CategorySum(
    UUID categoryId,
    String categoryName,
    Double totalAmount
) {}
