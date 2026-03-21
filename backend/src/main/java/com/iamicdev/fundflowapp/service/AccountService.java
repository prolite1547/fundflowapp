package com.iamicdev.fundflowapp.service;

import java.util.List;
import java.util.UUID;

import com.iamicdev.fundflowapp.dto.request.CreateAccountRequest;
import com.iamicdev.fundflowapp.dto.response.AccountResponse;
import com.iamicdev.fundflowapp.model.Account;
import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.repository.AccountRepository;
import com.iamicdev.fundflowapp.model.AccountType;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor    
@Service    
public class AccountService {

    private final AccountRepository accountRepository;
    private final AuthenticationService authenticationService;

    // ===============
    // CREATE ACCOUNT
    // ===============
    public AccountResponse createAccount(CreateAccountRequest request){
        User user = authenticationService.getAuthenticatedUser();
 
        Account account = new Account();
            account.setUserId(user.getId());
            account.setName(request.getName());
            account.setType(AccountType.valueOf(request.getType().toUpperCase()));
            account.setBalance(request.getInitialBalance());

        account = accountRepository.save(account);

        return AccountResponse.builder()
            .id(account.getId().toString())
            .name(account.getName())
            .type(account.getType().toString())
            .balance(account.getBalance())
            .build();
    }

    // ===============
    // GET MY ACCOUNTS
    // ===============
    public List<AccountResponse> getMyAccounts(){
         UUID userId = authenticationService.getAuthenticatedUser().getId();

        return accountRepository.findByUserId(userId)
        .stream()
        .map(account -> AccountResponse.builder()
            .id(account.getId().toString())
            .name(account.getName())
            .type(account.getType().toString())
            .balance(account.getBalance())
            .build())
        .toList();
    }
}