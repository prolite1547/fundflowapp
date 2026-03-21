package com.iamicdev.fundflowapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iamicdev.fundflowapp.dto.response.UserProfileResponse;
import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.service.AuthenticationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthenticationService authenticationService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        User user = authenticationService.getAuthenticatedUser();
        UserProfileResponse response = UserProfileResponse.builder()
                .userId(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
        return ResponseEntity.ok(response);
    }
}