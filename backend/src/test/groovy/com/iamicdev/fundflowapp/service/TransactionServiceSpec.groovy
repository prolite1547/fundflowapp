package com.iamicdev.fundflowapp.service

import com.iamicdev.fundflowapp.dto.request.CreateTransactionRequest
import com.iamicdev.fundflowapp.model.Account
import com.iamicdev.fundflowapp.model.Category
import com.iamicdev.fundflowapp.model.Transaction
import com.iamicdev.fundflowapp.model.TransactionType
import com.iamicdev.fundflowapp.model.User
import com.iamicdev.fundflowapp.repository.AccountRepository
import com.iamicdev.fundflowapp.repository.CategoryRepository
import com.iamicdev.fundflowapp.repository.TransactionRepository
import com.iamicdev.fundflowapp.strategy.ExpenseStrategy
import com.iamicdev.fundflowapp.strategy.IncomeStrategy
import com.iamicdev.fundflowapp.strategy.InvestmentStrategy
import com.iamicdev.fundflowapp.strategy.TransferStrategy
import com.iamicdev.fundflowapp.strategy.base.TransactionStrategy
import groovy.transform.CompileDynamic
import spock.lang.Specification

import java.time.Instant

@CompileDynamic
class TransactionServiceSpec extends Specification {

    TransactionRepository transactionRepository = Mock(TransactionRepository)
    AccountRepository accountRepository = Mock(AccountRepository)
    CategoryRepository categoryRepository = Mock(CategoryRepository)
    AuthenticationService authenticationService = Mock(AuthenticationService)
    Map<String, TransactionStrategy> strategies
    TransactionService transactionService

    UUID userId = UUID.randomUUID()
    UUID accountId = UUID.randomUUID()
    UUID categoryId = UUID.randomUUID()
    User mockUser
    Account mockAccount

    def setup() {
        mockUser = new User()
        mockUser.setId(userId)
        
        mockAccount = new Account()
        mockAccount.setId(accountId)
        mockAccount.setUserId(userId)
        mockAccount.setBalance(1000.0)
        mockAccount.setName("Mock Account")

        strategies = [
            "EXPENSE"    : new ExpenseStrategy(),
            "INCOME"     : new IncomeStrategy(),
            "INVESTMENT" : new InvestmentStrategy(),
            "TRANSFER"   : new TransferStrategy()
        ]

        transactionService = new TransactionService(transactionRepository, accountRepository, categoryRepository, authenticationService, strategies)
    }

    def "createTransaction - EXPENSE deducts from account balance"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findById(accountId) >> Optional.of(mockAccount)
        accountRepository.save(_) >> { it[0] }
        transactionRepository.save(_) >> { Transaction t -> t.setId(UUID.randomUUID()); t }
        categoryRepository.findById(_) >> Optional.empty()

        def request = CreateTransactionRequest.builder()
            .accountId(accountId)
            .categoryId(categoryId)
            .amount(200.0)
            .description("Groceries")
            .date(Instant.now())
            .type("EXPENSE")
            .build()

        when:
        def result = transactionService.createTransaction(request)

        then:
        mockAccount.balance == 800.0
    }

    def "createTransaction - INCOME adds to account balance"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findById(accountId) >> Optional.of(mockAccount)
        accountRepository.save(_) >> { it[0] }
        transactionRepository.save(_) >> { Transaction t -> t.setId(UUID.randomUUID()); t }
        categoryRepository.findById(_) >> Optional.empty()

        def request = CreateTransactionRequest.builder()
            .accountId(accountId)
            .categoryId(categoryId)
            .amount(3000.0)
            .description("Salary")
            .date(Instant.now())
            .type("INCOME")
            .build()

        when:
        transactionService.createTransaction(request)

        then:
        mockAccount.balance == 4000.0
    }

    def "createTransaction - TRANSFER moves funds between accounts"() {
        given:
        def destinationId = UUID.randomUUID()
        def destinationAccount = new Account()
        destinationAccount.setId(destinationId)
        destinationAccount.setBalance(500.0)
        destinationAccount.setName("Savings")

        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findById(accountId) >> Optional.of(mockAccount)
        accountRepository.findById(destinationId) >> Optional.of(destinationAccount)
        accountRepository.save(_) >> { it[0] }
        transactionRepository.save(_) >> { Transaction t -> t.setId(UUID.randomUUID()); t }
        categoryRepository.findById(_) >> Optional.empty()

        def request = CreateTransactionRequest.builder()
            .accountId(accountId)
            .destinationAccountId(destinationId)
            .categoryId(categoryId)
            .amount(300.0)
            .description("Transfer")
            .date(Instant.now())
            .type("TRANSFER")
            .build()

        when:
        def result = transactionService.createTransaction(request)

        then:
        mockAccount.balance == 700.0
        destinationAccount.balance == 800.0
    }

    def "createTransaction - throws when source account not found"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findById(_) >> Optional.empty()

        def request = CreateTransactionRequest.builder()
            .accountId(accountId)
            .categoryId(categoryId)
            .amount(100.0)
            .description("Test")
            .date(Instant.now())
            .type("EXPENSE")
            .build()

        when:
        transactionService.createTransaction(request)

        then:
        thrown(RuntimeException)
    }

    def "createTransaction - maps response fields correctly including names"() {
        given:
        def trxId = UUID.randomUUID()
        def category = new Category()
        category.setName("Coffee")
        categoryRepository.findById(_) >> Optional.of(category)

        mockAccount.setName("Bank")
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findById(_) >> Optional.of(mockAccount)
        accountRepository.save(_) >> { it[0] }
        
        transactionRepository.save(_) >> { Transaction t -> 
            t.setId(trxId)
            t.setAccountId(accountId)
            t.setCategoryId(categoryId)
            t.setAmount(100.0)
            t.setDate(Instant.now())
            t.setType(TransactionType.EXPENSE)
            t 
        }

        def request = CreateTransactionRequest.builder()
            .accountId(accountId)
            .categoryId(categoryId)
            .amount(100.0)
            .description("Coffee")
            .date(Instant.now())
            .type("EXPENSE")
            .build()

        when:
        def result = transactionService.createTransaction(request)

        then:
        result.id == trxId.toString()
        result.accountName == "Bank"
        result.categoryName == "Coffee"
    }

    def "myTransactions - returns all transactions for authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser

        def t = new Transaction()
        t.setId(UUID.randomUUID())
        t.setUserId(userId)
        t.setAccountId(accountId)
        t.setCategoryId(categoryId)
        t.setDescription("Groceries")
        t.setAmount(200.0)
        t.setDate(Instant.now())
        t.setType(TransactionType.EXPENSE)

        transactionRepository.findByUserId(userId) >> [t]
        accountRepository.findById(_) >> Optional.of(mockAccount)
        categoryRepository.findById(_) >> Optional.empty()

        when:
        def result = transactionService.myTransactions()

        then:
        result.size() == 1
        result[0].description == "Groceries"
    }
}
