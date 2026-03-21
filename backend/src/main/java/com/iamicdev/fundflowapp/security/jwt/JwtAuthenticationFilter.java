package com.iamicdev.fundflowapp.security.jwt;

import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.repository.UserRepository;
import com.iamicdev.fundflowapp.jwt.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends org.springframework.web.filter.OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("DEBUG: JwtAuthenticationFilter initialized");
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String userIdStr = jwtService.extractUserId(jwt);

            if (userIdStr != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UUID userId = UUID.fromString(userIdStr);
                Optional<User> userOpt = userRepository.findById(userId);
                
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    
                    if (jwtService.isTokenValid(jwt)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                user, null, user.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            // Log error in production or handle gracefully
        }

        filterChain.doFilter(request, response);
    }
}
