package com.iamicdev.fundflowapp.strategy

import com.iamicdev.fundflowapp.model.Account
import com.iamicdev.fundflowapp.model.AccountType
import com.iamicdev.fundflowapp.strategy.base.TransactionContext
import com.iamicdev.fundflowapp.exception.BadRequestException
import groovy.transform.CompileDynamic
import spock.lang.Specification
import spock.lang.Unroll

@CompileDynamic
class TransactionStrategySpec extends Specification {

    Account makeAccount(double balance) {
        def a = new Account()
        a.setId(UUID.randomUUID())
        a.setBalance(balance)
        a.setType(AccountType.BANK)
        return a
    }

    // ==============================
    // EXPENSE STRATEGY
    // ==============================

    def "ExpenseStrategy - deducts amount from source account"() {
        given:
        def account = makeAccount(1000.0)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(250.0)
            .build()

        when:
        new ExpenseStrategy().apply(context)

        then:
        account.balance == 750.0
    }

    def "ExpenseStrategy - full amount deduction results in zero balance"() {
        given:
        def account = makeAccount(500.0)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(500.0)
            .build()

        when:
        new ExpenseStrategy().apply(context)

        then:
        account.balance == 0.0
    }

    def "ExpenseStrategy - can result in negative balance (overdraft)"() {
        given:
        def account = makeAccount(100.0)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(200.0)
            .build()

        when:
        new ExpenseStrategy().apply(context)

        then:
        account.balance == -100.0
    }

    // ==============================
    // INCOME STRATEGY
    // ==============================

    def "IncomeStrategy - adds amount to source account"() {
        given:
        def account = makeAccount(500.0)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(1500.0)
            .build()

        when:
        new IncomeStrategy().apply(context)

        then:
        account.balance == 2000.0
    }

    def "IncomeStrategy - works with zero starting balance"() {
        given:
        def account = makeAccount(0.0)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(3000.0)
            .build()

        when:
        new IncomeStrategy().apply(context)

        then:
        account.balance == 3000.0
    }

    def "IncomeStrategy - adds fractional amounts correctly"() {
        given:
        def account = makeAccount(100.50)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(49.75)
            .build()

        when:
        new IncomeStrategy().apply(context)

        then:
        Math.abs(account.balance - 150.25) < 0.001
    }

    // ==============================
    // INVESTMENT STRATEGY
    // ==============================

    def "InvestmentStrategy - deducts amount from source account"() {
        given:
        def account = makeAccount(2000.0)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(800.0)
            .build()

        when:
        new InvestmentStrategy().apply(context)

        then:
        account.balance == 1200.0
    }

    // ==============================
    // TRANSFER STRATEGY
    // ==============================

    def "TransferStrategy - deducts from source and adds to destination"() {
        given:
        def source = makeAccount(1000.0)
        def destination = makeAccount(500.0)
        def context = TransactionContext.builder()
            .sourceAccount(source)
            .destinationAccount(destination)
            .amount(300.0)
            .build()

        when:
        new TransferStrategy().apply(context)

        then:
        source.balance == 700.0
        destination.balance == 800.0
    }

    def "TransferStrategy - throws when destination account is null"() {
        given:
        def source = makeAccount(1000.0)
        def context = TransactionContext.builder()
            .sourceAccount(source)
            .destinationAccount(null)
            .amount(200.0)
            .build()

        when:
        new TransferStrategy().apply(context)

        then:
        thrown(BadRequestException)
    }

    def "TransferStrategy - throws when source account is null"() {
        given:
        def destination = makeAccount(500.0)
        def context = TransactionContext.builder()
            .sourceAccount(null)
            .destinationAccount(destination)
            .amount(200.0)
            .build()

        when:
        new TransferStrategy().apply(context)

        then:
        thrown(BadRequestException)
    }

    def "TransferStrategy - transfers full balance correctly"() {
        given:
        def source = makeAccount(750.0)
        def destination = makeAccount(250.0)
        def context = TransactionContext.builder()
            .sourceAccount(source)
            .destinationAccount(destination)
            .amount(750.0)
            .build()

        when:
        new TransferStrategy().apply(context)

        then:
        source.balance == 0.0
        destination.balance == 1000.0
    }

    @Unroll
    def "strategy balances are correct with amount=#amount for INCOME"() {
        given:
        def account = makeAccount(start)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(amount)
            .build()

        when:
        new IncomeStrategy().apply(context)

        then:
        account.balance == expected

        where:
        start    | amount   | expected
        0.0      | 1000.0   | 1000.0
        500.0    | 500.0    | 1000.0
        9999.99  | 0.01     | 10000.0
        1000.0   | 0.0      | 1000.0
    }

    @Unroll
    def "strategy balances are correct with amount=#amount for EXPENSE"() {
        given:
        def account = makeAccount(initial)
        def context = TransactionContext.builder()
            .sourceAccount(account)
            .amount(amount)
            .build()

        when:
        new ExpenseStrategy().apply(context)

        then:
        account.balance == expected

        where:
        initial  | amount  | expected
        1000.0   | 100.0   | 900.0
        500.0    | 500.0   | 0.0
        200.0    | 300.0   | -100.0
        0.0      | 50.0    | -50.0
    }
}
