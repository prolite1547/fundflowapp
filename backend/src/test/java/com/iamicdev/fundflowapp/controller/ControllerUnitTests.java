package com.iamicdev.fundflowapp.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.iamicdev.fundflowapp.dto.request.CreateAccountRequest;
import com.iamicdev.fundflowapp.dto.request.CreateBudgetRequest;
import com.iamicdev.fundflowapp.dto.request.CreateCategoryRequest;
import com.iamicdev.fundflowapp.dto.request.CreateTransactionRequest;
import com.iamicdev.fundflowapp.dto.request.LoginRequest;
import com.iamicdev.fundflowapp.dto.request.RegisterRequest;
import com.iamicdev.fundflowapp.dto.response.AccountBalanceResponse;
import com.iamicdev.fundflowapp.dto.response.AccountResponse;
import com.iamicdev.fundflowapp.dto.response.AuthResponse;
import com.iamicdev.fundflowapp.dto.response.BudgetResponse;
import com.iamicdev.fundflowapp.dto.response.CategoryBreakdownResponse;
import com.iamicdev.fundflowapp.dto.response.CategoryResponse;
import com.iamicdev.fundflowapp.dto.response.DailyTrendResponse;
import com.iamicdev.fundflowapp.dto.response.SummaryResponse;
import com.iamicdev.fundflowapp.dto.response.TransactionResponse;
import com.iamicdev.fundflowapp.dto.response.UserProfileResponse;
import com.iamicdev.fundflowapp.model.ReportPeriod;
import com.iamicdev.fundflowapp.model.Role;
import com.iamicdev.fundflowapp.model.TransactionType;
import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.service.AccountService;
import com.iamicdev.fundflowapp.service.AuthenticationService;
import com.iamicdev.fundflowapp.service.BudgetService;
import com.iamicdev.fundflowapp.service.CategoryService;
import com.iamicdev.fundflowapp.service.ReportService;
import com.iamicdev.fundflowapp.service.TransactionService;

@ExtendWith(MockitoExtension.class)
class ControllerUnitTests {

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private AccountService accountService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private ReportService reportService;

    @Mock
    private TransactionService transactionService;

    @Test
    void authControllerRegisterDelegatesToService() {
        AuthController controller = new AuthController(authenticationService);
        RegisterRequest request = RegisterRequest.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .password("Secret@123")
                .build();
        AuthResponse expected = AuthResponse.builder()
                .accessToken("access")
                .refreshToken("refresh")
                .email("john@example.com")
                .build();

        when(authenticationService.register(request)).thenReturn(expected);

        ResponseEntity<AuthResponse> response = controller.register(request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(authenticationService).register(request);
    }

    @Test
    void authControllerLoginDelegatesToService() {
        AuthController controller = new AuthController(authenticationService);
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("Secret@123")
                .build();
        AuthResponse expected = AuthResponse.builder().accessToken("access").build();

        when(authenticationService.login(request)).thenReturn(expected);

        ResponseEntity<AuthResponse> response = controller.login(request);

        assertEquals(expected, response.getBody());
        verify(authenticationService).login(request);
    }

    @Test
    void authControllerRefreshDelegatesToService() {
        AuthController controller = new AuthController(authenticationService);
        AuthResponse expected = AuthResponse.builder().accessToken("new-access").build();

        when(authenticationService.refreshAccessToken("refresh-token")).thenReturn(expected);

        ResponseEntity<AuthResponse> response = controller.refresh("refresh-token");

        assertEquals(expected, response.getBody());
        verify(authenticationService).refreshAccessToken("refresh-token");
    }

    @Test
    void accountControllerCreateAccountReturnsServiceResult() {
        AccountController controller = new AccountController(accountService);
        CreateAccountRequest request = CreateAccountRequest.builder()
                .name("Wallet")
                .type("CASH")
                .initialBalance(100.0)
                .build();
        AccountResponse expected = AccountResponse.builder()
                .id(UUID.randomUUID().toString())
                .name("Wallet")
                .type("CASH")
                .balance(100.0)
                .build();

        when(accountService.createAccount(request)).thenReturn(expected);

        ResponseEntity<AccountResponse> response = controller.createAccount(request);

        assertEquals(expected, response.getBody());
        verify(accountService).createAccount(request);
    }

    @Test
    void accountControllerGetMyAccountsReturnsServiceResult() {
        AccountController controller = new AccountController(accountService);
        List<AccountResponse> expected = List.of(AccountResponse.builder().name("Savings").build());

        when(accountService.getMyAccounts()).thenReturn(expected);

        ResponseEntity<List<AccountResponse>> response = controller.getMyAccounts();

        assertEquals(expected, response.getBody());
        verify(accountService).getMyAccounts();
    }

    @Test
    void categoryControllerCreateCategoryReturnsServiceResult() {
        CategoryController controller = new CategoryController(categoryService);
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .name("Food")
                .type("EXPENSE")
                .icon("x")
                .color("#fff")
                .build();
        CategoryResponse expected = CategoryResponse.builder().name("Food").type("EXPENSE").build();

        when(categoryService.createCategory(request)).thenReturn(expected);

        ResponseEntity<CategoryResponse> response = controller.createCategory(request);

        assertEquals(expected, response.getBody());
        verify(categoryService).createCategory(request);
    }

    @Test
    void categoryControllerMyCategoriesReturnsServiceResult() {
        CategoryController controller = new CategoryController(categoryService);
        List<CategoryResponse> expected = List.of(CategoryResponse.builder().name("Food").build());

        when(categoryService.myCategories()).thenReturn(expected);

        ResponseEntity<List<CategoryResponse>> response = controller.myCategories();

        assertEquals(expected, response.getBody());
        verify(categoryService).myCategories();
    }

    @Test
    void transactionControllerCreateTransactionReturnsServiceResult() {
        TransactionController controller = new TransactionController(transactionService);
        CreateTransactionRequest request = CreateTransactionRequest.builder()
                .accountId(UUID.randomUUID())
                .categoryId(UUID.randomUUID())
                .amount(50.0)
                .description("Coffee")
                .date(Instant.now())
                .type("EXPENSE")
                .build();
        TransactionResponse expected = TransactionResponse.builder()
                .description("Coffee")
                .amount(50.0)
                .build();

        when(transactionService.createTransaction(request)).thenReturn(expected);

        ResponseEntity<TransactionResponse> response = controller.createTransaction(request);

        assertEquals(expected, response.getBody());
        verify(transactionService).createTransaction(request);
    }

    @Test
    void transactionControllerMyTransactionsReturnsServiceResult() {
        TransactionController controller = new TransactionController(transactionService);
        List<TransactionResponse> expected = List.of(TransactionResponse.builder().description("Coffee").build());

        when(transactionService.myTransactions()).thenReturn(expected);

        ResponseEntity<List<TransactionResponse>> response = controller.myTransactions();

        assertEquals(expected, response.getBody());
        verify(transactionService).myTransactions();
    }

    @Test
    void budgetControllerCreateReturnsServiceResult() {
        BudgetController controller = new BudgetController(budgetService);
        CreateBudgetRequest request = CreateBudgetRequest.builder()
                .categoryId(UUID.randomUUID())
                .limitAmount(1000.0)
                .month(3)
                .year(2026)
                .build();
        BudgetResponse expected = BudgetResponse.builder()
                .categoryId(request.getCategoryId().toString())
                .limitAmount(1000.0)
                .build();

        when(budgetService.createBudget(request)).thenReturn(expected);

        ResponseEntity<BudgetResponse> response = controller.create(request);

        assertEquals(expected, response.getBody());
        verify(budgetService).createBudget(request);
    }

    @Test
    void budgetControllerListReturnsServiceResult() {
        BudgetController controller = new BudgetController(budgetService);
        List<BudgetResponse> expected = List.of(BudgetResponse.builder().categoryName("Food").build());

        when(budgetService.getAllBudgets(3, 2026)).thenReturn(expected);

        ResponseEntity<List<BudgetResponse>> response = controller.list(3, 2026);

        assertEquals(expected, response.getBody());
        verify(budgetService).getAllBudgets(3, 2026);
    }

    @Test
    void reportControllerDelegatesAllEndpoints() {
        ReportController controller = new ReportController(reportService);
        LocalDate date = LocalDate.of(2026, 3, 21);
        SummaryResponse summary = SummaryResponse.builder().period(ReportPeriod.MONTHLY).totalIncome(1000.0).build();
        List<AccountBalanceResponse> balances = List.of(AccountBalanceResponse.builder().accountName("Cash").balance(100.0).build());
        List<CategoryBreakdownResponse> breakdown = List.of(CategoryBreakdownResponse.builder().categoryName("Food").totalAmount(50.0).percentage(100.0).build());
        List<DailyTrendResponse> trend = List.of(DailyTrendResponse.builder().date(date.toString()).income(10.0).build());

        when(reportService.getAccountBalances()).thenReturn(balances);
        when(reportService.getDaily(date)).thenReturn(summary);
        when(reportService.getWeekly(date)).thenReturn(summary);
        when(reportService.getMonthly(2026, 3)).thenReturn(summary);
        when(reportService.getYearly(2026)).thenReturn(summary);
        when(reportService.getRange(date.minusDays(1), date)).thenReturn(summary);
        when(reportService.getCategoryBreakdownDaily(date, TransactionType.EXPENSE)).thenReturn(breakdown);
        when(reportService.getCategoryBreakdownWeekly(date, TransactionType.INCOME)).thenReturn(breakdown);
        when(reportService.getCategoryBreakdownMonthly(2026, 3, TransactionType.INVESTMENT)).thenReturn(breakdown);
        when(reportService.getCategoryBreakdownYearly(2026, TransactionType.TRANSFER)).thenReturn(breakdown);
        when(reportService.getCategoryBreakdownRange(date.minusDays(7), date, null)).thenReturn(breakdown);
        when(reportService.getTrendWeekly(date)).thenReturn(trend);
        when(reportService.getTrendMonthly(2026, 3)).thenReturn(trend);
        when(reportService.getTrendYearly(2026)).thenReturn(trend);
        when(reportService.getTrendRange(date.minusDays(7), date)).thenReturn(trend);

        assertEquals(balances, controller.getAccountBalances().getBody());
        assertEquals(summary, controller.daily(date).getBody());
        assertEquals(summary, controller.weekly(date).getBody());
        assertEquals(summary, controller.monthly(2026, 3).getBody());
        assertEquals(summary, controller.yearly(2026).getBody());
        assertEquals(summary, controller.range(date.minusDays(1), date).getBody());
        assertEquals(breakdown, controller.breakdownDaily(date, TransactionType.EXPENSE).getBody());
        assertEquals(breakdown, controller.breakdownWeekly(date, TransactionType.INCOME).getBody());
        assertEquals(breakdown, controller.breakdownMonthly(2026, 3, TransactionType.INVESTMENT).getBody());
        assertEquals(breakdown, controller.breakdownYearly(2026, TransactionType.TRANSFER).getBody());
        assertEquals(breakdown, controller.breakdownRange(date.minusDays(7), date, null).getBody());
        assertEquals(trend, controller.trendWeekly(date).getBody());
        assertEquals(trend, controller.trendMonthly(2026, 3).getBody());
        assertEquals(trend, controller.trendYearly(2026).getBody());
        assertEquals(trend, controller.trendRange(date.minusDays(7), date).getBody());
    }

    @Test
    void userControllerGetProfileBuildsResponseFromAuthenticatedUser() {
        UserController controller = new UserController(authenticationService);
        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.USER)
                .password("encoded")
                .build();

        when(authenticationService.getAuthenticatedUser()).thenReturn(user);

        ResponseEntity<UserProfileResponse> response = controller.getProfile();

        assertNotNull(response.getBody());
        assertEquals(user.getId().toString(), response.getBody().getUserId());
        assertEquals("John Doe", response.getBody().getFullName());
        assertEquals("john@example.com", response.getBody().getEmail());
        assertEquals("USER", response.getBody().getRole());
        verify(authenticationService).getAuthenticatedUser();
    }
}
