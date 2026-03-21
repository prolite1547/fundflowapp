package com.iamicdev.fundflowapp.repository;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.iamicdev.fundflowapp.model.Transaction;
import com.iamicdev.fundflowapp.dto.SummaryArg;
import com.iamicdev.fundflowapp.dto.CategorySum;

import com.iamicdev.fundflowapp.model.TransactionType;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByUserId(UUID userId);
    List<Transaction> findByUserIdAndDateBetween(UUID userId, Instant start, Instant end);

    @Query("""
        SELECT new com.iamicdev.fundflowapp.dto.SummaryArg(
            coalesce(sum(case when t.type = com.iamicdev.fundflowapp.model.TransactionType.INCOME then t.amount else 0 end),0.0),
            coalesce(sum(case when t.type = com.iamicdev.fundflowapp.model.TransactionType.EXPENSE then t.amount else 0 end),0.0),
            coalesce(sum(case when t.type = com.iamicdev.fundflowapp.model.TransactionType.INVESTMENT then t.amount else 0 end),0.0)
        )
        FROM Transaction t
        WHERE t.userId = :userId
        AND t.date BETWEEN :start AND :end
    """)
    SummaryArg summary(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

    @Query("""
        SELECT new com.iamicdev.fundflowapp.dto.CategorySum(
            c.id,
            c.name,
            SUM(t.amount)
        )
        FROM Transaction t
        JOIN Category c ON t.categoryId = c.id
        WHERE t.userId = :userId
        AND t.type = :type
        AND t.date BETWEEN :start AND :end
        GROUP BY c.id, c.name
    """)
    List<CategorySum> categoryBreakdown(
        @Param("userId") UUID userId, 
        @Param("type") TransactionType type,
        @Param("start") Instant start, 
        @Param("end") Instant end
    );
}