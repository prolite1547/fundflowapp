package com.iamicdev.fundflowapp.service;

import java.util.UUID;
import java.util.List;
import java.time.LocalDate;
import java.time.ZoneId;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.iamicdev.fundflowapp.repository.BudgetRepository;
import com.iamicdev.fundflowapp.repository.CategoryRepository;
import com.iamicdev.fundflowapp.dto.request.CreateBudgetRequest;
import com.iamicdev.fundflowapp.dto.response.BudgetResponse;
import com.iamicdev.fundflowapp.model.Budget;
import com.iamicdev.fundflowapp.model.Transaction;
import com.iamicdev.fundflowapp.exception.ConflictException;



@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionService transactionService;
    private final AuthenticationService authenticationService;


    @Transactional
    public BudgetResponse createBudget(CreateBudgetRequest request) {
        var user = authenticationService.getAuthenticatedUser();
        UUID userId = user.getId();

        var existingBudget = budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, request.getCategoryId(), request.getMonth(), request.getYear());

        if(existingBudget.isPresent()) {
            throw new ConflictException("Budget already exists for this category in this month and year");
        }

        var budget = new Budget();
        budget.setUserId(userId);
        budget.setCategoryId(request.getCategoryId());
        budget.setLimitAmount(request.getLimitAmount());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        budget = budgetRepository.save(budget);

        return toResponse(budget);
    }

    public List<BudgetResponse> getAllBudgets(Integer month, Integer year){
        var user = authenticationService.getAuthenticatedUser();
        UUID userId = user.getId();
        
        List<Budget> budgets;
        if (month != null && year != null) {
            budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, month, year);
        } else {
            budgets = budgetRepository.findByUserId(userId);
        }

        return budgets.stream()
                .map(this::toResponse)
                .toList();
    }

    public BudgetResponse toResponse(Budget budget){
        var spent = calculateSpent(budget);
        var category = categoryRepository.findById(budget.getCategoryId()).orElse(null);
        return BudgetResponse.builder()
                .id(budget.getId().toString())
                .categoryId(budget.getCategoryId().toString())
                .limitAmount(budget.getLimitAmount())
                .month(budget.getMonth())
                .year(budget.getYear())
                .spentAmount(spent)
                .remainingAmount(budget.getLimitAmount() - spent)
                .categoryName(category != null ? category.getName() : null)
                .build();
    }

    private double calculateSpent(Budget budget){
        List<Transaction> trxList = transactionService.findByUserId(budget.getUserId());

        if (trxList == null) {
            return 0.0;
        }

        return trxList.stream()
                .filter(t -> t.getCategoryId().equals(budget.getCategoryId()))
                .filter(t -> t.getType().name().equals("EXPENSE"))
                .filter(t -> isSameMonthAndYear(t, budget))
                .mapToDouble(Transaction::getAmount)
                .sum();
    }

    private boolean isSameMonthAndYear(Transaction trx, Budget budget){
        LocalDate localDate = trx.getDate()
        .atZone(ZoneId.systemDefault())
        .toLocalDate();

        return localDate.getMonth().getValue() == budget.getMonth() 
        && localDate.getYear() == budget.getYear();
    }


}
