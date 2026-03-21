package com.iamicdev.fundflowapp.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserProfileResponse {
    private String userId;
    private String fullName;
    private String email;
    private String role;
}