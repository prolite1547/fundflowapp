package com.iamicdev.fundflowapp.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.iamicdev.fundflowapp.model.Budget;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByUserId(UUID userId);
    List<Budget> findByUserIdAndMonthAndYear(UUID userId, int month, int year);
    Optional<Budget> findByUserIdAndCategoryIdAndMonthAndYear(UUID userId, UUID categoryId, int month, int year);
}