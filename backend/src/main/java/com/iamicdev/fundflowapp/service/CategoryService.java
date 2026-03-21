package com.iamicdev.fundflowapp.service;

import java.util.UUID;
import java.util.List;


import org.springframework.stereotype.Service;

import com.iamicdev.fundflowapp.dto.request.CreateCategoryRequest;
import com.iamicdev.fundflowapp.dto.response.CategoryResponse;
import com.iamicdev.fundflowapp.model.Category;
import com.iamicdev.fundflowapp.model.CategoryType;
import com.iamicdev.fundflowapp.repository.CategoryRepository;
 

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final AuthenticationService authenticationService;

    // ===============
    // CREATE CATEGORY
    // ===============
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        UUID userId = authenticationService.getAuthenticatedUser().getId();
        Category category = new Category();
        category.setUserId(userId);
        category.setName(request.getName());
        category.setType(CategoryType.valueOf(request.getType().toUpperCase()));
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());

        category = categoryRepository.save(category);

        return CategoryResponse.builder()
                .id(category.getId().toString())
                .userId(category.getUserId().toString())
                .name(category.getName())
                .type(category.getType().toString())
                .icon(category.getIcon())
                .color(category.getColor())
                .build();
    }

    // ===============
    // GET MY CATEGORIES
    // ===============
    public List<CategoryResponse> myCategories() {
        UUID userId = authenticationService.getAuthenticatedUser().getId();
        return categoryRepository.findByUserId(userId).stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId().toString())
                        .userId(category.getUserId().toString())
                        .name(category.getName())
                        .type(category.getType().toString())
                        .icon(category.getIcon())
                        .color(category.getColor())
                        .build())
                .toList();
    }
}