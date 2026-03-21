package com.iamicdev.fundflowapp.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
  
   @NotBlank(message = "Email is required")
   @Email(message ="Email is invalid")
   private String email;

   @NotBlank(message = "Password is required")
   private String password;
}