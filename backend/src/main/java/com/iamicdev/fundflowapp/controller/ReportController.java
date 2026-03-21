package com.iamicdev.fundflowapp.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.iamicdev.fundflowapp.dto.response.AccountBalanceResponse;
import com.iamicdev.fundflowapp.dto.response.CategoryBreakdownResponse;
import com.iamicdev.fundflowapp.dto.response.DailyTrendResponse;
import com.iamicdev.fundflowapp.dto.response.SummaryResponse;
import com.iamicdev.fundflowapp.model.TransactionType;
import com.iamicdev.fundflowapp.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
     
    @GetMapping("/accounts/balances")
    public ResponseEntity<List<AccountBalanceResponse>> getAccountBalances() {
        return ResponseEntity.ok(reportService.getAccountBalances());
    }

    @GetMapping("/summary/daily")
    public ResponseEntity<SummaryResponse> daily(@RequestParam LocalDate date) {
        return ResponseEntity.ok(reportService.getDaily(date));
    }

    @GetMapping("/summary/weekly")
    public ResponseEntity<SummaryResponse> weekly(@RequestParam LocalDate date) {
        return ResponseEntity.ok(reportService.getWeekly(date));
    }

    @GetMapping("/summary/monthly")
    public ResponseEntity<SummaryResponse> monthly(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(reportService.getMonthly(year, month));
    }

    @GetMapping("/summary/yearly")
    public ResponseEntity<SummaryResponse> yearly(@RequestParam int year) {
        return ResponseEntity.ok(reportService.getYearly(year));
    }

    @GetMapping("/summary/range")
    public ResponseEntity<SummaryResponse> range(@RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(reportService.getRange(startDate, endDate));
    }

    @GetMapping("/breakdown/daily")
    public ResponseEntity<List<CategoryBreakdownResponse>> breakdownDaily(
        @RequestParam LocalDate date, 
        @RequestParam(required = false) TransactionType type) {
        return ResponseEntity.ok(reportService.getCategoryBreakdownDaily(date, type));
    }

    @GetMapping("/breakdown/weekly")
    public ResponseEntity<List<CategoryBreakdownResponse>> breakdownWeekly(
        @RequestParam LocalDate date, 
        @RequestParam(required = false) TransactionType type) {
        return ResponseEntity.ok(reportService.getCategoryBreakdownWeekly(date, type));
    }

    @GetMapping("/breakdown/monthly")
    public ResponseEntity<List<CategoryBreakdownResponse>> breakdownMonthly(
        @RequestParam int year, 
        @RequestParam int month, 
        @RequestParam(required = false) TransactionType type) {
        return ResponseEntity.ok(reportService.getCategoryBreakdownMonthly(year, month, type));
    }

    @GetMapping("/breakdown/yearly")
    public ResponseEntity<List<CategoryBreakdownResponse>> breakdownYearly(
        @RequestParam int year, 
        @RequestParam(required = false) TransactionType type) {
        return ResponseEntity.ok(reportService.getCategoryBreakdownYearly(year, type));
    }

    @GetMapping("/breakdown/range")
    public ResponseEntity<List<CategoryBreakdownResponse>> breakdownRange(
        @RequestParam LocalDate startDate, 
        @RequestParam LocalDate endDate, 
        @RequestParam(required = false) TransactionType type) {
        return ResponseEntity.ok(reportService.getCategoryBreakdownRange(startDate, endDate, type));
    }

    @GetMapping("/trend/weekly")
    public ResponseEntity<List<DailyTrendResponse>> trendWeekly(@RequestParam LocalDate date) {
        return ResponseEntity.ok(reportService.getTrendWeekly(date));
    }

    @GetMapping("/trend/monthly")
    public ResponseEntity<List<DailyTrendResponse>> trendMonthly(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(reportService.getTrendMonthly(year, month));
    }

    @GetMapping("/trend/yearly")
    public ResponseEntity<List<DailyTrendResponse>> trendYearly(@RequestParam int year) {
        return ResponseEntity.ok(reportService.getTrendYearly(year));
    }

    @GetMapping("/trend/range")
    public ResponseEntity<List<DailyTrendResponse>> trendRange(@RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(reportService.getTrendRange(startDate, endDate));
    }
}
