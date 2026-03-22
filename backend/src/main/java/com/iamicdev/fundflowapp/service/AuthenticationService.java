package com.iamicdev.fundflowapp.service;

import com.iamicdev.fundflowapp.repository.UserRepository;
import com.iamicdev.fundflowapp.repository.RefreshTokenRepository;
import com.iamicdev.fundflowapp.jwt.JwtService;
import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.model.RefreshToken;
import com.iamicdev.fundflowapp.model.Role;

import com.iamicdev.fundflowapp.dto.request.RegisterRequest;
import com.iamicdev.fundflowapp.dto.request.LoginRequest;
import com.iamicdev.fundflowapp.dto.response.AuthResponse;
import com.iamicdev.fundflowapp.exception.BadRequestException;
import com.iamicdev.fundflowapp.exception.ConflictException;
import com.iamicdev.fundflowapp.exception.UnauthorizedException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    // re-check password validation service level
    private void validatePassword(String password){
        if(password == null || password.isEmpty()){
            throw new BadRequestException("Password is required");
        }
        if(!password.matches("(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[@$!%*?&]).{8,}$")){
            throw new BadRequestException("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
        }
    }

    // ========================
    // REGISTER
    // ========================
    public AuthResponse register(RegisterRequest request){
        if(userRepository.findByEmail(request.getEmail()).isPresent()){
            throw new ConflictException("Email already exists");
        }
        validatePassword(request.getPassword());
        
        User user = new User();
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(Role.USER);
            user.setEnabled(true);

        user = userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = UUID.randomUUID().toString();

        // Save refresh token
        RefreshToken tokenEntity = new RefreshToken();
            tokenEntity.setToken(refreshToken);
            tokenEntity.setUser(user);
            tokenEntity.setExpiryDate(Instant.now().plusSeconds(refreshExpiration));

        refreshTokenRepository.save(tokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();

    }


    
    // -------------------------------
    //  LOGIN
    // -------------------------------
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        // Remove previous refresh tokens (logout from all devices)
        refreshTokenRepository.deleteByUserId(user.getId());

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = UUID.randomUUID().toString();

        RefreshToken tokenEntity = new RefreshToken();
            tokenEntity.setToken(refreshToken);
            tokenEntity.setUser(user);
            tokenEntity.setExpiryDate(Instant.now().plusSeconds(refreshExpiration));

        tokenEntity = refreshTokenRepository.save(tokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }

    // -------------------------------
    //  REFRESH TOKEN
    // -------------------------------
    public AuthResponse refreshAccessToken(String refreshToken) { 
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken) 
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token); 
            throw new UnauthorizedException("Refresh token expired.");
        }

        User user = token.getUser();

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) 
                .tokenType("Bearer")
                .userId(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }

    // -------------------------------
    //  GET AUTHENTICATED USER
    // -------------------------------
    public User getAuthenticatedUser(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication == null || !authentication.isAuthenticated()){
            throw new UnauthorizedException("User not authenticated");
        }
        return (User) authentication.getPrincipal();
    }



    
}