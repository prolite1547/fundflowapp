package com.iamicdev.fundflowapp.service

import com.iamicdev.fundflowapp.dto.request.CreateBudgetRequest
import com.iamicdev.fundflowapp.model.Budget
import com.iamicdev.fundflowapp.model.Transaction
import com.iamicdev.fundflowapp.model.TransactionType
import com.iamicdev.fundflowapp.model.User
import com.iamicdev.fundflowapp.repository.BudgetRepository
import com.iamicdev.fundflowapp.repository.CategoryRepository
import groovy.transform.CompileDynamic
import spock.lang.Specification

import java.time.Instant

@CompileDynamic
class BudgetServiceSpec extends Specification {

    BudgetRepository budgetRepository = Mock()
    CategoryRepository categoryRepository = Mock()
    TransactionService transactionService = Mock(TransactionService)
    AuthenticationService authenticationService = Mock()
    BudgetService budgetService

    UUID userId = UUID.randomUUID()
    UUID categoryId = UUID.randomUUID()
    User mockUser

    def setup() {
        budgetService = new BudgetService(budgetRepository, categoryRepository, transactionService, authenticationService)
        categoryRepository.findById(_) >> Optional.empty()
        mockUser = new User()
        mockUser.setId(userId)
        mockUser.setEmail("john@example.com")
    }

    // ==============================
    // CREATE BUDGET
    // ==============================

    def "createBudget - creates budget successfully"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, categoryId, 3, 2026) >> Optional.empty()
        transactionService.findByUserId(userId) >> []
        categoryRepository.findById(categoryId) >> Optional.empty()

        def request = new CreateBudgetRequest(categoryId: categoryId, limitAmount: 5000.0, month: 3, year: 2026)

        when:
        def result = budgetService.createBudget(request)

        then:
        1 * budgetRepository.save(_) >> { Budget b -> b.setId(UUID.randomUUID()); b }
        result.limitAmount == 5000.0
        result.month == 3
        result.year == 2026
        result.spentAmount == 0.0
        result.remainingAmount == 5000.0
    }

    def "createBudget - updates existing budget limit when budget already exists for same month and year"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def existing = new Budget()
        existing.setId(UUID.randomUUID())
        existing.setUserId(userId)
        existing.setCategoryId(categoryId)
        existing.setLimitAmount(500.0)
        existing.setMonth(3)
        existing.setYear(2026)
        
        budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, categoryId, 3, 2026) >> Optional.of(existing)
        transactionService.findByUserId(userId) >> []
        categoryRepository.findById(categoryId) >> Optional.empty()

        def request = new CreateBudgetRequest(categoryId: categoryId, limitAmount: 1000.0, month: 3, year: 2026)

        when:
        def result = budgetService.createBudget(request)

        then:
        1 * budgetRepository.save(_) >> { Budget b -> b }
        result.limitAmount == 1000.0
        result.month == 3
        result.year == 2026
        result.spentAmount == 0.0
        result.remainingAmount == 1000.0
    }

    def "createBudget - associates budget with authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, categoryId, 1, 2026) >> Optional.empty()
        transactionService.findByUserId(userId) >> []
        categoryRepository.findById(categoryId) >> Optional.empty()
        Budget savedBudget = null

        def request = new CreateBudgetRequest(categoryId: categoryId, limitAmount: 2000.0, month: 1, year: 2026)

        when:
        budgetService.createBudget(request)

        then:
        1 * budgetRepository.save(_) >> { Budget b ->
            savedBudget = b
            b.setId(UUID.randomUUID())
            b
        }
        savedBudget.userId == userId
    }

    // ==============================
    // GET ALL BUDGETS
    // ==============================

    def "getAllBudgets - returns all budgets for user when no filters provided"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        
        def b1 = new Budget()
        b1.setId(UUID.randomUUID())
        b1.setUserId(userId)
        b1.setCategoryId(categoryId)
        b1.setLimitAmount(500.0)
        b1.setMonth(1)
        b1.setYear(2026)

        def b2 = new Budget()
        b2.setId(UUID.randomUUID())
        b2.setUserId(userId)
        b2.setCategoryId(categoryId)
        b2.setLimitAmount(1000.0)
        b2.setMonth(2)
        b2.setYear(2026)

        budgetRepository.findByUserId(userId) >> [b1, b2]
        transactionService.findByUserId(_) >> []
        categoryRepository.findById(_) >> Optional.empty()

        when:
        def result = budgetService.getAllBudgets(null, null)

        then:
        result.size() == 2
        1 * budgetRepository.findByUserId(userId) >> [b1, b2]
        0 * budgetRepository.findByUserIdAndMonthAndYear(_, _, _)
    }

    def "getAllBudgets - returns filtered budgets when month and year provided"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        
        def b = new Budget()
        b.setId(UUID.randomUUID())
        b.setUserId(userId)
        b.setCategoryId(categoryId)
        b.setLimitAmount(1500.0)
        b.setMonth(3)
        b.setYear(2026)

        budgetRepository.findByUserIdAndMonthAndYear(userId, 3, 2026) >> [b]
        transactionService.findByUserId(userId) >> []
        categoryRepository.findById(_) >> Optional.empty()

        when:
        def result = budgetService.getAllBudgets(3, 2026)

        then:
        result.size() == 1
        result[0].month == 3
        1 * budgetRepository.findByUserIdAndMonthAndYear(userId, 3, 2026) >> [b]
        0 * budgetRepository.findByUserId(userId)
    }

    def "getAllBudgets - returns empty list when user has no budgets"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        budgetRepository.findByUserId(userId) >> []
        transactionService.findByUserId(userId) >> []

        when:
        def result = budgetService.getAllBudgets(null, null)

        then:
        result.isEmpty()
    }

    // ==============================
    // CALCULATE SPENT (via toResponse)
    // ==============================

    def "toResponse - calculates spentAmount from matching EXPENSE transactions"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def matchingTrx = new Transaction()
        matchingTrx.setId(UUID.randomUUID())
        matchingTrx.setCategoryId(categoryId)
        matchingTrx.setType(TransactionType.EXPENSE)
        matchingTrx.setAmount(200.0)
        matchingTrx.setDate(Instant.parse("2026-03-15T00:00:00Z"))

        transactionService.findByUserId(userId) >> [matchingTrx]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 200.0
        result.remainingAmount == 800.0
    }

    def "toResponse - excludes INCOME transactions from spentAmount"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def incomeTrx = new Transaction()
        incomeTrx.setCategoryId(categoryId)
        incomeTrx.setType(TransactionType.INCOME)
        incomeTrx.setAmount(500.0)
        incomeTrx.setDate(Instant.parse("2026-03-10T00:00:00Z"))

        transactionService.findByUserId(userId) >> [incomeTrx]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 0.0
        result.remainingAmount == 1000.0
    }

    def "toResponse - excludes transactions from different months"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def oldTrx = new Transaction()
        oldTrx.setCategoryId(categoryId)
        oldTrx.setType(TransactionType.EXPENSE)
        oldTrx.setAmount(300.0)
        oldTrx.setDate(Instant.parse("2026-02-15T00:00:00Z")) // February - should be excluded

        transactionService.findByUserId(userId) >> [oldTrx]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 0.0
    }

    def "toResponse - excludes transactions from different categories"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def otherCategoryTrx = new Transaction()
        otherCategoryTrx.setCategoryId(UUID.randomUUID()) // different category
        otherCategoryTrx.setType(TransactionType.EXPENSE)
        otherCategoryTrx.setAmount(400.0)
        otherCategoryTrx.setDate(Instant.parse("2026-03-10T00:00:00Z"))

        transactionService.findByUserId(userId) >> [otherCategoryTrx]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 0.0
    }

    def "toResponse - aggregates multiple matching EXPENSE transactions"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def trx1 = new Transaction()
        trx1.setCategoryId(categoryId)
        trx1.setType(TransactionType.EXPENSE)
        trx1.setAmount(150.0)
        trx1.setDate(Instant.parse("2026-03-01T00:00:00Z"))

        def trx2 = new Transaction()
        trx2.setCategoryId(categoryId)
        trx2.setType(TransactionType.EXPENSE)
        trx2.setAmount(350.0)
        trx2.setDate(Instant.parse("2026-03-20T00:00:00Z"))

        transactionService.findByUserId(userId) >> [trx1, trx2]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 500.0
        result.remainingAmount == 500.0
    }

    def "toResponse - remainingAmount is zero when spent equals limit"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def trx = new Transaction()
        trx.setCategoryId(categoryId)
        trx.setType(TransactionType.EXPENSE)
        trx.setAmount(1000.0)
        trx.setDate(Instant.parse("2026-03-10T00:00:00Z"))

        transactionService.findByUserId(userId) >> [trx]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 1000.0
        result.remainingAmount == 0.0
    }

    def "toResponse - remainingAmount is negative when spent exceeds limit"() {
        given:
        def budget = new Budget()
        budget.setId(UUID.randomUUID())
        budget.setUserId(userId)
        budget.setCategoryId(categoryId)
        budget.setLimitAmount(1000.0)
        budget.setMonth(3)
        budget.setYear(2026)

        def trx = new Transaction()
        trx.setCategoryId(categoryId)
        trx.setType(TransactionType.EXPENSE)
        trx.setAmount(1200.0)
        trx.setDate(Instant.parse("2026-03-10T00:00:00Z"))

        transactionService.findByUserId(userId) >> [trx]

        when:
        def result = budgetService.toResponse(budget)

        then:
        result.spentAmount == 1200.0
        result.remainingAmount == -200.0
    }
}
