package com.iamicdev.fundflowapp.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;

class JwtServiceTests {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "6a142d125ebf46308ef094d01f5453a05ef73e1de30255f65ac9362bb789f5de");
        ReflectionTestUtils.setField(jwtService, "expiration", 900L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800L);
    }

    @Test
    void generateAccessTokenAndExtractUserIdWorkTogether() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "john@example.com");

        assertNotNull(token);
        assertEquals(userId.toString(), jwtService.extractUserId(token));
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void generateRefreshTokenProducesParsableClaims() {
        String token = jwtService.generateRefreshToken("refresh-token-value");

        Claims claims = jwtService.parseClaims(token);

        assertEquals("refresh-token-value", claims.getSubject());
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValidReturnsFalseForNullEmptyAndMalformedValues() {
        assertFalse(jwtService.isTokenValid(null));
        assertFalse(jwtService.isTokenValid(""));
        assertFalse(jwtService.isTokenValid("not-a-jwt"));
    }

    @Test
    void parseClaimsContainsEmailForAccessToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "john@example.com");

        Claims claims = jwtService.parseClaims(token);

        assertEquals(userId.toString(), claims.getSubject());
        assertEquals("john@example.com", claims.get("email", String.class));
    }
}
