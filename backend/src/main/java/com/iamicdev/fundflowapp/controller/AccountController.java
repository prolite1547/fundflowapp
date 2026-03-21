package com.iamicdev.fundflowapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.iamicdev.fundflowapp.dto.request.CreateAccountRequest;
import com.iamicdev.fundflowapp.dto.response.AccountResponse;
import com.iamicdev.fundflowapp.service.AccountService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {
    
    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@RequestBody CreateAccountRequest request){
        System.out.println("CONTROLLER: POST /api/accounts - " + request.getName());
        return ResponseEntity.ok(accountService.createAccount(request));
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getMyAccounts(){
        System.out.println("CONTROLLER: GET /api/accounts");
        return ResponseEntity.ok(accountService.getMyAccounts());
    }
}