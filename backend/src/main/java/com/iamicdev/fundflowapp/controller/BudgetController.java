package com.iamicdev.fundflowapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.iamicdev.fundflowapp.dto.request.CreateBudgetRequest;
import com.iamicdev.fundflowapp.dto.response.BudgetResponse;

import com.iamicdev.fundflowapp.service.BudgetService;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@RequestBody CreateBudgetRequest request) {
        return ResponseEntity.ok(budgetService.createBudget(request));
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> list(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(budgetService.getAllBudgets(month, year));
    }
}
