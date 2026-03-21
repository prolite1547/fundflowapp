package com.iamicdev.fundflowapp.service

import com.iamicdev.fundflowapp.dto.request.CreateCategoryRequest
import com.iamicdev.fundflowapp.model.Category
import com.iamicdev.fundflowapp.model.CategoryType
import com.iamicdev.fundflowapp.model.User
import com.iamicdev.fundflowapp.repository.CategoryRepository
import groovy.transform.CompileDynamic
import spock.lang.Specification
import spock.lang.Unroll

@CompileDynamic
class CategoryServiceSpec extends Specification {

    CategoryRepository categoryRepository = Mock()
    AuthenticationService authenticationService = Mock()
    CategoryService categoryService

    UUID userId = UUID.randomUUID()
    User mockUser

    def setup() {
        categoryService = new CategoryService(categoryRepository, authenticationService)
        mockUser = new User()
        mockUser.setId(userId)
        mockUser.setEmail("john@example.com")
    }

    // ==============================
    // CREATE CATEGORY
    // ==============================

    def "createCategory - creates EXPENSE category successfully"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateCategoryRequest(name: "Food", type: "EXPENSE", icon: "🍔", color: "#FF5733")

        when:
        def result = categoryService.createCategory(request)

        then:
        1 * categoryRepository.save(_) >> { Category c -> c.setId(UUID.randomUUID()); c }
        result.name == "Food"
        result.type == "EXPENSE"
        result.icon == "🍔"
        result.color == "#FF5733"
        result.userId == userId.toString()
    }

    @Unroll
    def "createCategory - creates category for valid type '#type'"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateCategoryRequest(name: "Cat", type: type, icon: null, color: null)

        when:
        def result = categoryService.createCategory(request)

        then:
        1 * categoryRepository.save(_) >> { Category c -> c.setId(UUID.randomUUID()); c }
        result.type == type

        where:
        type         | _
        "EXPENSE"    | _
        "INCOME"     | _
        "INVESTMENT" | _
    }

    def "createCategory - throws exception for invalid CategoryType"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateCategoryRequest(name: "Bad", type: "UNKNOWN_TYPE", icon: null, color: null)

        when:
        categoryService.createCategory(request)

        then:
        thrown(IllegalArgumentException)
    }

    def "createCategory - handles null icon and color gracefully"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateCategoryRequest(name: "Savings", type: "INCOME", icon: null, color: null)

        when:
        def result = categoryService.createCategory(request)

        then:
        1 * categoryRepository.save(_) >> { Category c -> c.setId(UUID.randomUUID()); c }
        result.icon == null
        result.color == null
    }

    def "createCategory - associates category with authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def request = new CreateCategoryRequest(name: "Transport", type: "EXPENSE", icon: "🚗", color: "#333")
        Category savedCategory = null

        when:
        categoryService.createCategory(request)

        then:
        1 * categoryRepository.save(_) >> { Category c ->
            savedCategory = c
            c.setId(UUID.randomUUID())
            c
        }
        savedCategory.userId == userId
    }

    // ==============================
    // MY CATEGORIES
    // ==============================

    def "myCategories - returns all categories for authenticated user"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser

        def cat1 = new Category()
        cat1.setId(UUID.randomUUID())
        cat1.setUserId(userId)
        cat1.setName("Food")
        cat1.setType(CategoryType.EXPENSE)
        cat1.setIcon("🍔")
        cat1.setColor("#FF0000")

        def cat2 = new Category()
        cat2.setId(UUID.randomUUID())
        cat2.setUserId(userId)
        cat2.setName("Salary")
        cat2.setType(CategoryType.INCOME)
        cat2.setIcon("💰")
        cat2.setColor("#00FF00")

        categoryRepository.findByUserId(userId) >> [cat1, cat2]

        when:
        def result = categoryService.myCategories()

        then:
        result.size() == 2
        result[0].name == "Food"
        result[1].name == "Salary"
    }

    def "myCategories - returns empty list when user has no categories"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        categoryRepository.findByUserId(userId) >> []

        when:
        def result = categoryService.myCategories()

        then:
        result.isEmpty()
    }

    def "myCategories - maps all fields correctly"() {
        given:
        authenticationService.getAuthenticatedUser() >> mockUser
        def catId = UUID.randomUUID()
        def cat = new Category()
        cat.setId(catId)
        cat.setUserId(userId)
        cat.setName("Rent")
        cat.setType(CategoryType.EXPENSE)
        cat.setIcon("🏠")
        cat.setColor("#ABCDEF")

        categoryRepository.findByUserId(userId) >> [cat]

        when:
        def result = categoryService.myCategories()

        then:
        result[0].id == catId.toString()
        result[0].userId == userId.toString()
        result[0].name == "Rent"
        result[0].type == "EXPENSE"
        result[0].icon == "🏠"
        result[0].color == "#ABCDEF"
    }
}
