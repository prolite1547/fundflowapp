package com.iamicdev.fundflowapp.service;

import java.util.List;
import java.util.ArrayList;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.iamicdev.fundflowapp.dto.response.AccountBalanceResponse;
import com.iamicdev.fundflowapp.dto.response.SummaryResponse;
import com.iamicdev.fundflowapp.repository.AccountRepository;
import com.iamicdev.fundflowapp.repository.TransactionRepository;
import com.iamicdev.fundflowapp.dto.response.CategoryBreakdownResponse;
import com.iamicdev.fundflowapp.dto.CategorySum;
import com.iamicdev.fundflowapp.dto.SummaryArg;
import com.iamicdev.fundflowapp.model.ReportPeriod;
import com.iamicdev.fundflowapp.dto.response.DailyTrendResponse;
import com.iamicdev.fundflowapp.model.Transaction;
import com.iamicdev.fundflowapp.model.TransactionType;
import com.iamicdev.fundflowapp.util.DateRange;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final TransactionRepository transactionRepository;
    private final AuthenticationService authenticationService;
    private final AccountRepository accountRepository;

    public List<AccountBalanceResponse> getAccountBalances(){
        var user = authenticationService.getAuthenticatedUser();
        return accountRepository.findByUserId(user.getId()).stream().map(account -> {
            return AccountBalanceResponse.builder()
            .accountId(account.getId().toString())
            .accountName(account.getName())
            .balance(account.getBalance())
            .build();
        }).toList();
    }


    public SummaryResponse getDaily(LocalDate date){
        return getSummary(ReportPeriod.DAILY, date, null, null, null, null);
    }

    public SummaryResponse getWeekly(LocalDate date){
        return getSummary(ReportPeriod.WEEKLY, date, null, null, null, null);
    }

    public SummaryResponse getMonthly(int year, int month){
        return getSummary(ReportPeriod.MONTHLY, null, year, month, null, null);
    }

    public SummaryResponse getYearly(int year){
        return getSummary(ReportPeriod.YEARLY, null, year, null, null, null);
    }

    public SummaryResponse getRange(LocalDate startDate, LocalDate endDate){
        return getSummary(ReportPeriod.RANGE, null, null, null, startDate, endDate);
    }

   public SummaryResponse getSummary(
    ReportPeriod period, 
    LocalDate referenceDate, 
    Integer year, 
    Integer month, 
    LocalDate startDate, 
    LocalDate endDate){
    
    UUID userId = authenticationService.getAuthenticatedUser().getId();
    
    ZoneId zone = ZoneId.systemDefault();
    
    DateRange.InstantRange range = switch(period){
        case DAILY -> DateRange.forDaily(referenceDate, zone);
        case WEEKLY -> DateRange.forWeekly(referenceDate, zone);
        case MONTHLY -> DateRange.forMonthly(year, month, zone);
        case YEARLY -> DateRange.forYearly(year, zone);
        case RANGE -> DateRange.forRange(startDate, endDate, zone);
    };

    SummaryArg arg = transactionRepository.summary(
        userId,
        range.startInclusive(),
        range.endExclusive()
    );

    double totalIncome = arg.totalIncome();
    double totalExpense = arg.totalExpense();
    double totalInvestment = arg.totalInvestment();
    
    double netSavings = totalIncome - totalExpense - totalInvestment;
    double savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    return SummaryResponse.builder()
    .period(period)
    .start(range.startInclusive().toString())
    .end(range.endExclusive().toString())
    .totalIncome(totalIncome)
    .totalExpense(totalExpense)
    .totalInvestment(totalInvestment)
    .netSavings(netSavings)
    .savingsRate(savingsRate)
    .build();
    
   }

   public List<CategoryBreakdownResponse> getCategoryBreakdownDaily(LocalDate date, TransactionType type){
       return getCategoryBreakdown(ReportPeriod.DAILY, date, null, null, null, null, type);
   }

   public List<CategoryBreakdownResponse> getCategoryBreakdownWeekly(LocalDate date, TransactionType type){
       return getCategoryBreakdown(ReportPeriod.WEEKLY, date, null, null, null, null, type);
   }

   public List<CategoryBreakdownResponse> getCategoryBreakdownMonthly(int year, int month, TransactionType type){
       return getCategoryBreakdown(ReportPeriod.MONTHLY, null, year, month, null, null, type);
   }

   public List<CategoryBreakdownResponse> getCategoryBreakdownYearly(int year, TransactionType type){
       return getCategoryBreakdown(ReportPeriod.YEARLY, null, year, null, null, null, type);
   }

   public List<CategoryBreakdownResponse> getCategoryBreakdownRange(LocalDate startDate, LocalDate endDate, TransactionType type){
       return getCategoryBreakdown(ReportPeriod.RANGE, null, null, null, startDate, endDate, type);
   }

   public List<CategoryBreakdownResponse> getCategoryBreakdown(
    ReportPeriod period, 
    LocalDate referenceDate, 
    Integer year, 
    Integer month, 
    LocalDate startDate, 
    LocalDate endDate,
    TransactionType type){
    
    UUID userId = authenticationService.getAuthenticatedUser().getId();
    ZoneId zone = ZoneId.systemDefault();
    
    DateRange.InstantRange range = switch(period){
        case DAILY -> DateRange.forDaily(referenceDate, zone);
        case WEEKLY -> DateRange.forWeekly(referenceDate, zone);
        case MONTHLY -> DateRange.forMonthly(year, month, zone);
        case YEARLY -> DateRange.forYearly(year, zone);
        case RANGE -> DateRange.forRange(startDate, endDate, zone);
    };

    List<CategorySum> breakdowns = transactionRepository.categoryBreakdown(
        userId,
        type != null ? type : TransactionType.EXPENSE,
        range.startInclusive(),
        range.endExclusive()
    );

    double totalAmount = breakdowns.stream()
        .mapToDouble(CategorySum::totalAmount)
        .sum();

    return breakdowns.stream()
        .map(sum -> CategoryBreakdownResponse.builder()
            .categoryId(sum.categoryId().toString())
            .categoryName(sum.categoryName())
            .totalAmount(sum.totalAmount())
            .percentage(totalAmount > 0 ? (sum.totalAmount() / totalAmount) * 100 : 0)
            .build())
        .toList();
   }

   public List<DailyTrendResponse> getTrendWeekly(LocalDate date){
       return getTrend(ReportPeriod.WEEKLY, date, null, null, null, null);
   }

   public List<DailyTrendResponse> getTrendMonthly(int year, int month){
       return getTrend(ReportPeriod.MONTHLY, null, year, month, null, null);
   }

   public List<DailyTrendResponse> getTrendYearly(int year){
       return getTrend(ReportPeriod.YEARLY, null, year, null, null, null);
   }

   public List<DailyTrendResponse> getTrendRange(LocalDate startDate, LocalDate endDate){
       return getTrend(ReportPeriod.RANGE, null, null, null, startDate, endDate);
   }

   public List<DailyTrendResponse> getTrend(
       ReportPeriod period, 
       LocalDate referenceDate, 
       Integer year, 
       Integer month, 
       LocalDate startDate, 
       LocalDate endDate){
       
       UUID userId = authenticationService.getAuthenticatedUser().getId();
       ZoneId zone = ZoneId.systemDefault();
       
       DateRange.InstantRange range = switch(period){
           case DAILY -> DateRange.forDaily(referenceDate, zone);
           case WEEKLY -> DateRange.forWeekly(referenceDate, zone);
           case MONTHLY -> DateRange.forMonthly(year, month, zone);
           case YEARLY -> DateRange.forYearly(year, zone);
           case RANGE -> DateRange.forRange(startDate, endDate, zone);
       };

       List<Transaction> transactions = transactionRepository.findByUserIdAndDateBetween(
           userId, 
           range.startInclusive(), 
           range.endExclusive()
       );

       Map<LocalDate, List<Transaction>> grouped = transactions.stream()
           .collect(Collectors.groupingBy(t -> t.getDate().atZone(zone).toLocalDate()));

       LocalDate start = range.startInclusive().atZone(zone).toLocalDate();
       LocalDate end = range.endExclusive().atZone(zone).toLocalDate();
       
       List<DailyTrendResponse> trend = new ArrayList<>();
       for (LocalDate date = start; date.isBefore(end); date = date.plusDays(1)) {
           List<Transaction> dayTransactions = grouped.getOrDefault(date, new ArrayList<>());
           
           double income = dayTransactions.stream()
               .filter(t -> t.getType() == TransactionType.INCOME)
               .mapToDouble(Transaction::getAmount).sum();
           double expense = dayTransactions.stream()
               .filter(t -> t.getType() == TransactionType.EXPENSE)
               .mapToDouble(Transaction::getAmount).sum();
           double investment = dayTransactions.stream()
               .filter(t -> t.getType() == TransactionType.INVESTMENT)
               .mapToDouble(Transaction::getAmount).sum();
               
           trend.add(DailyTrendResponse.builder()
               .date(date.toString())
               .income(income)
               .expense(expense)
               .investment(investment)
               .net(income - expense - investment)
               .build());
       }
       
       return trend;
   }
}