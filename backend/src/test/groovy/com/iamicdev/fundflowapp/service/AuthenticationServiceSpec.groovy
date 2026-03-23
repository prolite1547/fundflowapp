package com.iamicdev.fundflowapp.service

import com.iamicdev.fundflowapp.dto.request.LoginRequest
import com.iamicdev.fundflowapp.dto.request.RegisterRequest
import com.iamicdev.fundflowapp.jwt.JwtService
import com.iamicdev.fundflowapp.model.RefreshToken
import com.iamicdev.fundflowapp.model.Role
import com.iamicdev.fundflowapp.model.User
import com.iamicdev.fundflowapp.repository.RefreshTokenRepository
import com.iamicdev.fundflowapp.repository.UserRepository
import com.iamicdev.fundflowapp.exception.BadRequestException
import com.iamicdev.fundflowapp.exception.ConflictException
import com.iamicdev.fundflowapp.exception.UnauthorizedException
import groovy.transform.CompileDynamic
import org.springframework.security.crypto.password.PasswordEncoder
import spock.lang.Specification
import spock.lang.Unroll

import java.time.Instant

@CompileDynamic
class AuthenticationServiceSpec extends Specification {

    UserRepository userRepository = Mock()
    RefreshTokenRepository refreshTokenRepository = Mock()
    PasswordEncoder passwordEncoder = Mock()
    JwtService jwtService = Mock()

    AuthenticationService authService

    def setup() {
        authService = new AuthenticationService(userRepository, refreshTokenRepository, passwordEncoder, jwtService)
        authService.refreshExpiration = 604800L // 7 days in seconds
    }

    // ==============================
    // REGISTER
    // ==============================

    def "register - success with valid request returns AuthResponse"() {
        given:
        def request = new RegisterRequest("John Doe", "john@example.com", "Secret@123")

        userRepository.findByEmail("john@example.com") >> Optional.empty()
        passwordEncoder.encode("Secret@123") >> "hashed_password"
        jwtService.generateAccessToken(_ as UUID, "john@example.com") >> "access_token_abc"

        when:
        def result = authService.register(request)

        then:
        1 * userRepository.save(_) >> { User u -> u.setId(UUID.randomUUID()); u }
        1 * refreshTokenRepository.save(_)
        result.accessToken == "access_token_abc"
        result.tokenType == "Bearer"
        result.email == "john@example.com"
        result.fullName == "John Doe"
        result.refreshToken != null
    }

    def "register - throws when email already exists"() {
        given:
        def request = new RegisterRequest("John Doe", "existing@example.com", "Secret@123")
        userRepository.findByEmail("existing@example.com") >> Optional.of(new User())

        when:
        authService.register(request)

        then:
        thrown(ConflictException)
    }

    @Unroll
    def "register - throws BadRequestException for invalid password: '#password'"() {
        given:
        def request = new RegisterRequest("John Doe", "john@example.com", password)
        userRepository.findByEmail("john@example.com") >> Optional.empty()

        when:
        authService.register(request)

        then:
        thrown(BadRequestException)

        where:
        password        | _
        ""              | _
        "short"         | _
        "alllowercase1@" | _
        "ALLUPPERCASE1@" | _
        "NoSpecialChar1" | _
        "NoNumber@Abc"  | _
    }

    def "register - password with exactly minimum length is accepted"() {
        given:
        def request = new RegisterRequest("John Doe", "john@example.com", "Secure@1")
        userRepository.findByEmail("john@example.com") >> Optional.empty()
        passwordEncoder.encode("Secure@1") >> "hashed"
        jwtService.generateAccessToken(_ as UUID, _) >> "token"

        when:
        def result = authService.register(request)

        then:
        1 * userRepository.save(_) >> { User u -> u.setId(UUID.randomUUID()); u }
        result != null
        result.accessToken == "token"
    }

    // ==============================
    // LOGIN
    // ==============================

    def "login - success with valid credentials"() {
        given:
        def user = new User()
        user.setId(UUID.randomUUID())
        user.setEmail("john@example.com")
        user.setFullName("John Doe")
        user.setPassword("hashed_password")
        user.setRole(Role.USER)

        def request = new LoginRequest("john@example.com", "Secret@123")

        userRepository.findByEmail("john@example.com") >> Optional.of(user)
        passwordEncoder.matches("Secret@123", "hashed_password") >> true
        jwtService.generateAccessToken(user.id, "john@example.com") >> "access_token_xyz"

        when:
        def result = authService.login(request)

        then:
        1 * refreshTokenRepository.deleteByUserId(user.id)
        1 * refreshTokenRepository.save(_)
        result.accessToken == "access_token_xyz"
        result.email == "john@example.com"
        result.userId == user.id.toString()
    }

    def "login - throws UnauthorizedException when user not found"() {
        given:
        def request = new LoginRequest("unknown@example.com", "Secret@123")
        userRepository.findByEmail("unknown@example.com") >> Optional.empty()

        when:
        authService.login(request)

        then:
        thrown(UnauthorizedException)
    }

    def "login - throws UnauthorizedException when password does not match"() {
        given:
        def user = new User()
        user.setPassword("hashed_password")
        def request = new LoginRequest("john@example.com", "WrongPass@1")

        userRepository.findByEmail("john@example.com") >> Optional.of(user)
        passwordEncoder.matches("WrongPass@1", "hashed_password") >> false

        when:
        authService.login(request)

        then:
        thrown(UnauthorizedException)
    }

    def "login - deletes previous refresh tokens before issuing new one"() {
        given:
        def userId = UUID.randomUUID()
        def user = new User()
        user.setId(userId)
        user.setEmail("john@example.com")
        user.setPassword("hashed")
        user.setFullName("John")
        user.setRole(Role.USER)

        userRepository.findByEmail("john@example.com") >> Optional.of(user)
        passwordEncoder.matches(_, _) >> true
        jwtService.generateAccessToken(_, _) >> "token"

        when:
        authService.login(new LoginRequest("john@example.com", "Secret@1"))

        then:
        1 * refreshTokenRepository.deleteByUserId(userId)
    }

    // ==============================
    // REFRESH ACCESS TOKEN
    // ==============================

    def "refreshAccessToken - returns new access token with valid refresh token"() {
        given:
        def user = new User()
        user.setId(UUID.randomUUID())
        user.setEmail("john@example.com")
        user.setFullName("John Doe")
        user.setRole(Role.USER)

        def token = new RefreshToken()
        token.token = "valid-refresh-token"
        token.user = user
        token.expiryDate = Instant.now().plusSeconds(3600)

        refreshTokenRepository.findByToken("valid-refresh-token") >> Optional.of(token)
        jwtService.generateAccessToken(user.id, "john@example.com") >> "new_access_token"

        when:
        def result = authService.refreshAccessToken("valid-refresh-token")

        then:
        result.accessToken == "new_access_token"
        result.refreshToken == "valid-refresh-token"
        result.email == "john@example.com"
    }

    def "refreshAccessToken - throws when token not found"() {
        given:
        refreshTokenRepository.findByToken("bad-token") >> Optional.empty()

        when:
        authService.refreshAccessToken("bad-token")

        then:
        thrown(UnauthorizedException)
    }

    def "refreshAccessToken - throws when token is expired"() {
        given:
        def user = new User()
        def token = new RefreshToken()
        token.setToken("expired-token")
        token.setUser(user)
        token.setExpiryDate(Instant.now().minusSeconds(1))

        refreshTokenRepository.findByToken("expired-token") >> Optional.of(token)

        when:
        authService.refreshAccessToken("expired-token")

        then:
        thrown(UnauthorizedException)
    }
}
