package com.iamicdev.fundflowapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.iamicdev.fundflowapp.dto.request.CreateTransactionRequest;
import com.iamicdev.fundflowapp.dto.response.TransactionResponse;
import com.iamicdev.fundflowapp.service.TransactionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(@RequestBody CreateTransactionRequest request) {
        return ResponseEntity.ok(transactionService.createTransaction(request));
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> myTransactions() {
        return ResponseEntity.ok(transactionService.myTransactions());
    }
}