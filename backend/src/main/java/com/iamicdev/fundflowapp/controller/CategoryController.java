package com.iamicdev.fundflowapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.iamicdev.fundflowapp.dto.request.CreateCategoryRequest;
import com.iamicdev.fundflowapp.dto.response.CategoryResponse;
import com.iamicdev.fundflowapp.service.CategoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> myCategories() {
        return ResponseEntity.ok(categoryService.myCategories());
    }
}