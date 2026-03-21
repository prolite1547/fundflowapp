package com.iamicdev.fundflowapp.service

import com.iamicdev.fundflowapp.dto.request.CreateAccountRequest
import com.iamicdev.fundflowapp.model.Account
import com.iamicdev.fundflowapp.model.AccountType
import com.iamicdev.fundflowapp.model.User
import com.iamicdev.fundflowapp.repository.AccountRepository
import spock.lang.Specification
import spock.lang.Unroll

class AccountServiceSpec extends Specification {

    AccountRepository accountRepository = Mock()
    AuthenticationService authenticationService = Mock()
    AccountService accountService

    UUID userId = UUID.randomUUID()
    User mockUser

    def setup() {
        accountService = new AccountService(accountRepository, authenticationService)
        mockUser = new User()
        mockUser.setId(userId)
        mockUser.setEmail("john@example.com")
        mockUser.setFullName("John Doe")
    }

    // ==============================
    // CREATE ACCOUNT
    // ==============================

    def "createAccount - creates BANK account with initial balance"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateAccountRequest(name: "My Wallet", type: "BANK", initialBalance: 500.0)

        when:
        def result = accountService.createAccount(request)

        then:
        1 * accountRepository.save(_) >> { Account a -> a.setId(UUID.randomUUID()); a }
        result.name == "My Wallet"
        result.type == "BANK"
        result.balance == 500.0
        result.id != null
    }

    def "createAccount - uses 0.0 as default balance when initialBalance is not provided"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateAccountRequest(name: "Savings", type: "BANK", initialBalance: 0.0)

        when:
        def result = accountService.createAccount(request)

        then:
        1 * accountRepository.save(_) >> { Account a -> a.setId(UUID.randomUUID()); a }
        result.balance == 0.0
    }

    @Unroll
    def "createAccount - creates account with type '#type'"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateAccountRequest(name: "Account", type: type, initialBalance: 100.0)

        when:
        def result = accountService.createAccount(request)

        then:
        1 * accountRepository.save(_) >> { Account a -> a.setId(UUID.randomUUID()); a }
        result.type == type

        where:
        type           | _
        "BANK"         | _
        "CREDIT_CARD"  | _
        "LOAN"         | _
        "E_WALLET"     | _
        "OTHER"        | _
    }

    def "createAccount - associates account with authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateAccountRequest(name: "My Account", type: "BANK", initialBalance: 0.0)
        Account savedAccount = null

        when:
        accountService.createAccount(request)

        then:
        1 * accountRepository.save(_) >> { Account a ->
            savedAccount = a
            a.setId(UUID.randomUUID())
            a
        }
        savedAccount.userId == userId
    }

    def "createAccount - throws exception for invalid account type"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateAccountRequest(name: "My Account", type: "INVALID_TYPE", initialBalance: 0.0)

        when:
        accountService.createAccount(request)

        then:
        thrown(IllegalArgumentException)
    }

    // ==============================
    // GET MY ACCOUNTS
    // ==============================

    def "getMyAccounts - returns list of accounts for authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser

        def account1 = new Account()
        account1.setId(UUID.randomUUID())
        account1.setUserId(userId)
        account1.setName("Wallet")
        account1.setType(AccountType.BANK)
        account1.setBalance(100.0)

        def account2 = new Account()
        account2.setId(UUID.randomUUID())
        account2.setUserId(userId)
        account2.setName("Bank")
        account2.setType(AccountType.BANK)
        account2.setBalance(5000.0)

        accountRepository.findByUserId(userId) >> [account1, account2]

        when:
        def result = accountService.getMyAccounts()

        then:
        result.size() == 2
        result[0].name == "Wallet"
        result[1].name == "Bank"
    }

    def "getMyAccounts - returns empty list when user has no accounts"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        accountRepository.findByUserId(userId) >> []

        when:
        def result = accountService.getMyAccounts()

        then:
        result.isEmpty()
    }

    def "getMyAccounts - maps all account fields correctly"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def accountId = UUID.randomUUID()
        def account = new Account()
        account.setId(accountId)
        account.setName("Investment Account")
        account.setType(AccountType.OTHER)
        account.setBalance(9999.99)

        accountRepository.findByUserId(userId) >> [account]

        when:
        def result = accountService.getMyAccounts()

        then:
        result[0].id == accountId.toString()
        result[0].name == "Investment Account"
        result[0].type == "OTHER"
        result[0].balance == 9999.99
    }
}
