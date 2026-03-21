package com.iamicdev.fundflowapp.security.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import com.iamicdev.fundflowapp.jwt.JwtService;
import com.iamicdev.fundflowapp.model.Role;
import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTests {

    @Mock
    private UserRepository userRepository;

    private JwtService jwtService;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "6a142d125ebf46308ef094d01f5453a05ef73e1de30255f65ac9362bb789f5de");
        ReflectionTestUtils.setField(jwtService, "expiration", 900L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800L);
        filter = new JwtAuthenticationFilter(jwtService, userRepository);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternalSkipsWhenAuthorizationHeaderMissing() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        TrackingFilterChain chain = new TrackingFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(1, chain.invocationCount);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternalSkipsWhenAuthorizationHeaderIsNotBearer() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic abc123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TrackingFilterChain chain = new TrackingFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(1, chain.invocationCount);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternalAuthenticatesUserForValidJwt() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("john@example.com")
                .fullName("John Doe")
                .password("encoded")
                .role(Role.USER)
                .enabled(true)
                .build();
        String token = jwtService.generateAccessToken(userId, user.getEmail());

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        TrackingFilterChain chain = new TrackingFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(1, chain.invocationCount);
        assertEquals(user, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        verify(userRepository).findById(userId);
    }

    @Test
    void doFilterInternalHandlesMalformedJwtGracefully() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid.jwt.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TrackingFilterChain chain = new TrackingFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(1, chain.invocationCount);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternalLeavesContextEmptyWhenUserNotFound() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "john@example.com");

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        TrackingFilterChain chain = new TrackingFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(1, chain.invocationCount);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(userRepository).findById(userId);
    }

    @Test
    void doFilterInternalDoesNotOverrideExistingAuthentication() throws Exception {
        UUID userId = UUID.randomUUID();
        User existingUser = User.builder()
                .id(userId)
                .email("existing@example.com")
                .password("encoded")
                .role(com.iamicdev.fundflowapp.model.Role.USER)
                .enabled(true)
                .build();
        String token = jwtService.generateAccessToken(userId, existingUser.getEmail());
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        existingUser,
                        null,
                        existingUser.getAuthorities()
                )
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        TrackingFilterChain chain = new TrackingFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(1, chain.invocationCount);
        assertEquals(existingUser, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    private static final class TrackingFilterChain implements FilterChain {
        private int invocationCount;

        @Override
        public void doFilter(jakarta.servlet.ServletRequest request, jakarta.servlet.ServletResponse response)
                throws java.io.IOException, ServletException {
            invocationCount++;
        }
    }
}
