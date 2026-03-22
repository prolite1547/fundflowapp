package com.iamicdev.fundflowapp.service;

import java.util.Map;
import java.util.UUID;
import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.iamicdev.fundflowapp.dto.request.CreateTransactionRequest;
import com.iamicdev.fundflowapp.dto.response.TransactionResponse;
import com.iamicdev.fundflowapp.repository.TransactionRepository;
import com.iamicdev.fundflowapp.repository.AccountRepository;
import com.iamicdev.fundflowapp.repository.CategoryRepository;
import com.iamicdev.fundflowapp.strategy.base.TransactionStrategy;
import com.iamicdev.fundflowapp.strategy.base.TransactionContext;
import com.iamicdev.fundflowapp.model.TransactionType;
import com.iamicdev.fundflowapp.model.Transaction;
import com.iamicdev.fundflowapp.model.Account;
import com.iamicdev.fundflowapp.model.Category;
import com.iamicdev.fundflowapp.exception.ResourceNotFoundException;

@RequiredArgsConstructor
@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final AuthenticationService authenticationService;
    private final Map<String, TransactionStrategy> strategies;

    // ===============
    // CREATE TRANSACTION
    // ===============
    @Transactional
    public TransactionResponse createTransaction(CreateTransactionRequest request) {
        var user = authenticationService.getAuthenticatedUser();
        var type = TransactionType.valueOf(request.getType());

        Account sourceAccount = accountRepository.findById(request.getAccountId())
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Account destinationAccount = null;

        if(type == TransactionType.TRANSFER) {
            destinationAccount = accountRepository.findById(request.getDestinationAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
        }

        TransactionContext context = TransactionContext.builder()
            .type(type)
            .sourceAccount(sourceAccount)
            .destinationAccount(destinationAccount)
            .amount(request.getAmount())
            .build();

        TransactionStrategy strategy = strategies.get(type.name());
        strategy.apply(context);

        sourceAccount = accountRepository.save(sourceAccount);
        if(destinationAccount != null) {
            destinationAccount = accountRepository.save(destinationAccount);
        }

        Transaction transaction = new Transaction();
        transaction.setUserId(user.getId());
        transaction.setAccountId(sourceAccount.getId());
        transaction.setCategoryId(request.getCategoryId());
        transaction.setDescription(request.getDescription());
        transaction.setAmount(request.getAmount());
        transaction.setDate(request.getDate());
        transaction.setType(type);

        transaction = transactionRepository.save(transaction);

        return TransactionResponse.builder()
            .id(transaction.getId().toString())
            .accountId(transaction.getAccountId().toString())
            .categoryId(transaction.getCategoryId().toString())
            .description(transaction.getDescription())
            .amount(transaction.getAmount())
            .date(transaction.getDate())
            .type(transaction.getType().name())
            .accountName(sourceAccount.getName())
            .categoryName(categoryRepository.findById(transaction.getCategoryId()).map(Category::getName).orElse(null))
            .build();
    }

    // ===============
    // GET MY TRANSACTIONS
    // ===============
    public List<TransactionResponse> myTransactions() {
        var user = authenticationService.getAuthenticatedUser();
        return transactionRepository.findByUserId(user.getId())
            .stream()
            .map(transaction -> {
                var category = categoryRepository.findById(transaction.getCategoryId()).orElse(null);
                var account = accountRepository.findById(transaction.getAccountId()).orElse(null);
                return TransactionResponse.builder()
                    .id(transaction.getId().toString())
                    .accountId(transaction.getAccountId().toString())
                    .categoryId(transaction.getCategoryId().toString())
                    .description(transaction.getDescription())
                    .amount(transaction.getAmount())
                    .date(transaction.getDate())
                    .type(transaction.getType().name())
                    .categoryName(category != null ? category.getName() : null)
                    .accountName(account != null ? account.getName() : null)
                    .build();
            })
            .toList();
    }

    // ===============
    // FIND BY USER ID (for internal use)
    // ===============
    public List<Transaction> findByUserId(UUID userId) {
        return transactionRepository.findByUserId(userId);
    }
}
