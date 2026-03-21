package com.iamicdev.fundflowapp.repository;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.iamicdev.fundflowapp.model.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserId(UUID userId);
}