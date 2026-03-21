package com.iamicdev.fundflowapp.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
 
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;

    @NotBlank(message = "Password is required")   
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[@$!%*?&]).{8,}$",
            message = "Password must be 8+ chars, contain upper/lowercase, number, and special char"
    )
    private String password;
}