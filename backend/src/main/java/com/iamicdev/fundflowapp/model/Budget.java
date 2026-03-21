package com.iamicdev.fundflowapp.model;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "budgets")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Budget {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID categoryId;

    @Column(nullable = false)
    private Double limitAmount;

    @Column(nullable = false)
    private int month; // 1 to 12

    @Column(nullable = false)
    private int year;

}
