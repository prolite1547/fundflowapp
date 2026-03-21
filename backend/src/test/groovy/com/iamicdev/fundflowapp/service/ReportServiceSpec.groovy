package com.iamicdev.fundflowapp.service

import com.iamicdev.fundflowapp.model.Account
import com.iamicdev.fundflowapp.model.AccountType
import com.iamicdev.fundflowapp.model.Transaction
import com.iamicdev.fundflowapp.model.TransactionType
import com.iamicdev.fundflowapp.model.User
import com.iamicdev.fundflowapp.repository.AccountRepository
import com.iamicdev.fundflowapp.repository.TransactionRepository
import groovy.transform.CompileDynamic
import java.time.LocalDate
import java.time.Instant
import java.time.ZoneId
import spock.lang.Specification

@CompileDynamic
class ReportServiceSpec extends Specification {

    TransactionRepository transactionRepository = Mock()
    AuthenticationService authenticationService = Mock()
    AccountRepository accountRepository = Mock()
    ReportService reportService

    UUID userId = UUID.randomUUID()
    User mockUser

    def setup() {
        reportService = new ReportService(transactionRepository, authenticationService, accountRepository)
        mockUser = new User()
        mockUser.setId(userId)
        mockUser.setEmail("john@example.com")
    }

    def "getAccountBalances - returns balances for all user accounts"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser

        def account1 = new Account()
        account1.setId(UUID.randomUUID())
        account1.setName("Cash Wallet")
        account1.setType(AccountType.BANK)
        account1.setBalance(500.0)

        def account2 = new Account()
        account2.setId(UUID.randomUUID())
        account2.setName("Bank Account")
        account2.setType(AccountType.BANK)
        account2.setBalance(15000.0)

        accountRepository.findByUserId(userId) >> [account1, account2]

        when:
        def result = reportService.getAccountBalances()

        then:
        result.size() == 2
        result[0].accountName == "Cash Wallet"
        result[0].balance == 500.0
        result[1].accountName == "Bank Account"
        result[1].balance == 15000.0
    }

    def "getAccountBalances - returns empty list when user has no accounts"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findByUserId(userId) >> []

        when:
        def result = reportService.getAccountBalances()

        then:
        result.isEmpty()
    }

    def "getAccountBalances - maps accountId and accountName correctly"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def accountId = UUID.randomUUID()
        def account = new Account()
        account.setId(accountId)
        account.setName("Investment Portfolio")
        account.setType(AccountType.OTHER)
        account.setBalance(99999.0)

        accountRepository.findByUserId(userId) >> [account]

        when:
        def result = reportService.getAccountBalances()

        then:
        result[0].accountId == accountId.toString()
        result[0].accountName == "Investment Portfolio"
        result[0].balance == 99999.0
    }

    def "getAccountBalances - reflects correct balance including zero balance"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def account = new Account()
        account.setId(UUID.randomUUID())
        account.setName("Empty Wallet")
        account.setBalance(0.0)

        accountRepository.findByUserId(userId) >> [account]

        when:
        def result = reportService.getAccountBalances()

        then:
        result[0].balance == 0.0
    }

    def "getAccountBalances - only queries accounts for authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findByUserId(userId) >> []

        when:
        reportService.getAccountBalances()

        then:
        1 * accountRepository.findByUserId(_) >> []
    }

    def "getDaily - returns summary for a specific day"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def date = LocalDate.of(2026, 3, 7)
        def arg = new com.iamicdev.fundflowapp.dto.SummaryArg(100.0, 50.0, 0.0)
        transactionRepository.summary(userId, _, _) >> arg

        when:
        def result = reportService.getDaily(date)

        then:
        result.totalIncome == 100.0
        result.totalExpense == 50.0
        result.netSavings == 50.0
        result.savingsRate == 50.0
    }

    def "getWeekly - returns summary for a specific week"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def date = LocalDate.of(2026, 3, 7)
        def arg = new com.iamicdev.fundflowapp.dto.SummaryArg(700.0, 350.0, 0.0)
        transactionRepository.summary(userId, _, _) >> arg

        when:
        def result = reportService.getWeekly(date)

        then:
        result.totalIncome == 700.0
        result.totalExpense == 350.0
        result.netSavings == 350.0
        result.savingsRate == 50.0
    }

    def "getMonthly - returns summary for a specific month"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def arg = new com.iamicdev.fundflowapp.dto.SummaryArg(3000.0, 1500.0, 500.0)
        transactionRepository.summary(userId, _, _) >> arg

        when:
        def result = reportService.getMonthly(2026, 3)

        then:
        result.totalIncome == 3000.0
        result.totalExpense == 1500.0
        result.totalInvestment == 500.0
        result.netSavings == 1000.0
        Math.abs(result.savingsRate - (1000.0 / 3000.0) * 100) < 0.0001
    }

    def "getYearly - returns summary for a specific year"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def arg = new com.iamicdev.fundflowapp.dto.SummaryArg(36000.0, 18000.0, 6000.0)
        transactionRepository.summary(userId, _, _) >> arg

        when:
        def result = reportService.getYearly(2026)

        then:
        result.totalIncome == 36000.0
        result.totalExpense == 18000.0
        result.totalInvestment == 6000.0
        result.netSavings == 12000.0
        Math.abs(result.savingsRate - (12000.0 / 36000.0) * 100) < 0.0001
    }

    def "getRange - returns summary for a date range"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def startDate = LocalDate.of(2026, 3, 1)
        def endDate = LocalDate.of(2026, 3, 15)
        def arg = new com.iamicdev.fundflowapp.dto.SummaryArg(1500.0, 750.0, 250.0)
        transactionRepository.summary(userId, _, _) >> arg

        when:
        def result = reportService.getRange(startDate, endDate)

        then:
        result.totalIncome == 1500.0
        result.totalExpense == 750.0
        result.totalInvestment == 250.0
        result.netSavings == 500.0
        Math.abs(result.savingsRate - (500.0 / 1500.0) * 100) < 0.0001
    }

    def "getCategoryBreakdown - returns correct grouping and percentages"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def date = LocalDate.of(2026, 3, 7)
        def cat1Id = UUID.randomUUID()
        def cat2Id = UUID.randomUUID()
        
        def sum1 = new com.iamicdev.fundflowapp.dto.CategorySum(cat1Id, "Food", 300.0)
        def sum2 = new com.iamicdev.fundflowapp.dto.CategorySum(cat2Id, "Rent", 700.0)
        
        transactionRepository.categoryBreakdown(userId, TransactionType.EXPENSE, _, _) >> [sum1, sum2]

        when:
        def result = reportService.getCategoryBreakdownDaily(date, TransactionType.EXPENSE)

        then:
        result.size() == 2
        result.find { it.categoryName == "Food" }.totalAmount == 300.0
        result.find { it.categoryName == "Food" }.percentage == 30.0
        result.find { it.categoryName == "Rent" }.totalAmount == 700.0
        result.find { it.categoryName == "Rent" }.percentage == 70.0
    }

    def "getCategoryBreakdown - supports different transaction types (e.g. INCOME)"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def date = LocalDate.of(2026, 3, 7)
        def catId = UUID.randomUUID()
        def sum = new com.iamicdev.fundflowapp.dto.CategorySum(catId, "Salary", 5000.0)
        
        transactionRepository.categoryBreakdown(userId, TransactionType.INCOME, _, _) >> [sum]

        when:
        def result = reportService.getCategoryBreakdownDaily(date, TransactionType.INCOME)

        then:
        result.size() == 1
        result[0].categoryName == "Salary"
        result[0].totalAmount == 5000.0
        result[0].percentage == 100.0
    }

    def "getTrend - returns daily trend with gap filling"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def date = LocalDate.of(2026, 3, 7)
        // Instant for March 7th 12:00 UTC
        def instant = date.atStartOfDay(ZoneId.systemDefault()).toInstant().plusSeconds(3600*12)
        
        def t1 = new Transaction()
        t1.setType(TransactionType.INCOME)
        t1.setAmount(1000.0)
        t1.setDate(instant)
        
        def t2 = new Transaction()
        t2.setType(TransactionType.EXPENSE)
        t2.setAmount(200.0)
        t2.setDate(instant)
        
        transactionRepository.findByUserIdAndDateBetween(userId, _, _) >> [t1, t2]

        when:
        def result = reportService.getTrendWeekly(date)

        then:
        result.size() == 7
        def day7 = result.find { it.date == "2026-03-07" }
        day7.income == 1000.0
        day7.expense == 200.0
        day7.net == 800.0
        
        def otherDays = result.findAll { it.date != "2026-03-07" }
        otherDays.every { it.income == 0.0 && it.expense == 0.0 && it.net == 0.0 }
    }
}
