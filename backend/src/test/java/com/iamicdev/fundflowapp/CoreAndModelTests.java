package com.iamicdev.fundflowapp;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mockStatic;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import com.iamicdev.fundflowapp.model.Role;
import com.iamicdev.fundflowapp.model.User;
import com.iamicdev.fundflowapp.util.DateRange;

class CoreAndModelTests {

    @Test
    void mainDelegatesToSpringApplication() {
        String[] args = {"--spring.main.web-application-type=none"};

        try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
            FundflowappApplication.main(args);
            springApplication.verify(() -> SpringApplication.run(FundflowappApplication.class, args));
        }
    }

    @Test
    void dateRangeDefaultConstructorCanBeInstantiated() {
        DateRange dateRange = new DateRange();

        assertTrue(dateRange instanceof DateRange);
    }

    @Test
    void userImplementsUserDetailsContract() {
        User user = User.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .password("encoded")
                .role(Role.USER)
                .enabled(true)
                .build();

        assertEquals("john@example.com", user.getUsername());
        assertEquals(1, user.getAuthorities().size());
        assertEquals("ROLE_USER", user.getAuthorities().iterator().next().getAuthority());
        assertTrue(user.isAccountNonExpired());
        assertTrue(user.isAccountNonLocked());
        assertTrue(user.isCredentialsNonExpired());
        assertTrue(user.isEnabled());
    }

    @Test
    void userIsEnabledReturnsFalseWhenEnabledIsNullOrFalse() {
        User nullEnabledUser = User.builder()
                .email("null@example.com")
                .password("encoded")
                .role(Role.USER)
                .enabled(null)
                .build();
        User disabledUser = User.builder()
                .email("disabled@example.com")
                .password("encoded")
                .role(Role.USER)
                .enabled(false)
                .build();

        assertFalse(nullEnabledUser.isEnabled());
        assertFalse(disabledUser.isEnabled());
    }
}
