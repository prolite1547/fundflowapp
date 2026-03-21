package com.iamicdev.fundflowapp.jwt;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
     
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    
    private Key getSignKey() {
         String debugSecret = "6a142d125ebf46308ef094d01f5453a05ef73e1de30255f65ac9362bb789f5de";
         return Keys.hmacShaKeyFor(debugSecret.getBytes());
    }


    public String generateAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("email", email)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(expiration))) // 15 minutes
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String tokenValue) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(tokenValue)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(refreshExpiration))) // 7 days
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUserId(String token){
        return parseClaims(token).getSubject();
    }

    public Boolean isTokenValid(String token){
    if(token == null || token.isEmpty()) return false;    
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }    
    }

    public Claims parseClaims(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
        


}