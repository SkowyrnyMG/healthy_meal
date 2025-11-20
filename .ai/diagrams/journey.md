# User Journey Diagram

## Overview

This document presents a state diagram visualizing user journeys through the HealthyMeal application, focusing on authentication, onboarding, and core functionality access.

## User Journey Analysis

### User Paths

1. **New User Journey**
   - Landing page → Register → Profile setup → Dashboard → Use app

2. **Returning User Journey**
   - Landing page → Login → Dashboard → Use app

3. **Password Recovery Journey**
   - Login page → Forgot password → Check email → Reset password → Login

4. **Unauthenticated User Journey**
   - Landing page → View public content only

5. **Authenticated User Journey**
   - Dashboard → Manage recipes → Modify with AI → Organize collections

### Main States

- **Landing Page** - Entry point, marketing content
- **Login** - Authentication for existing users
- **Registration** - Account creation for new users
- **Password Reset** - Recovery flow for forgotten passwords
- **Dashboard** - Main hub after authentication
- **Profile Setup** - User preferences and dietary goals
- **Recipe Management** - Core functionality

### Decision Points

- User has account? → Login or Register
- Credentials valid? → Success or Error
- Profile complete? → Dashboard or Setup
- Session valid? → Continue or Re-authenticate

---

## State Diagram

```mermaid
stateDiagram-v2
    %% Initial state
    [*] --> LandingPage

    %% Landing Page
    state "Landing Page" as LandingPage {
        [*] --> ViewMarketing
        ViewMarketing --> ChooseAction
    }

    %% User decision point
    state user_choice <<choice>>
    LandingPage --> user_choice
    user_choice --> Login: Has account
    user_choice --> Registration: New user
    user_choice --> PublicContent: Browse only

    %% === REGISTRATION FLOW ===
    state "Registration Process" as Registration {
        [*] --> RegistrationForm
        RegistrationForm --> ValidateRegistration

        state reg_valid <<choice>>
        ValidateRegistration --> reg_valid
        reg_valid --> CreateAccount: Data valid
        reg_valid --> RegistrationForm: Validation error

        CreateAccount --> AutoLogin
        AutoLogin --> [*]
    }

    %% === LOGIN FLOW ===
    state "Login Process" as Login {
        [*] --> LoginForm
        LoginForm --> ValidateCredentials

        state login_valid <<choice>>
        ValidateCredentials --> login_valid
        login_valid --> AuthSuccess: Credentials valid
        login_valid --> LoginForm: Invalid credentials

        LoginForm --> ForgotPassword: Forgot password?
        AuthSuccess --> [*]
    }

    %% === PASSWORD RESET FLOW ===
    state "Password Reset" as PasswordReset {
        [*] --> EnterEmail
        EnterEmail --> SendResetLink
        SendResetLink --> CheckEmail

        note right of CheckEmail
            User receives email
            with reset link
        end note

        CheckEmail --> ClickResetLink
        ClickResetLink --> NewPasswordForm
        NewPasswordForm --> ValidateNewPassword

        state pwd_valid <<choice>>
        ValidateNewPassword --> pwd_valid
        pwd_valid --> PasswordUpdated: Password valid
        pwd_valid --> NewPasswordForm: Too weak

        PasswordUpdated --> [*]
    }

    ForgotPassword --> PasswordReset
    PasswordReset --> Login: Password reset complete

    %% === PROFILE SETUP ===
    state "Profile Setup" as ProfileSetup {
        [*] --> BasicInfo
        BasicInfo --> DietaryPreferences
        DietaryPreferences --> Goals
        Goals --> [*]

        note right of BasicInfo
            Weight, age, gender,
            activity level
        end note

        note right of DietaryPreferences
            Diet type, allergens,
            disliked ingredients
        end note

        note right of Goals
            Weight goal,
            target values
        end note
    }

    %% Check if profile is complete
    state profile_check <<choice>>
    Registration --> profile_check
    Login --> profile_check

    profile_check --> ProfileSetup: Profile incomplete
    profile_check --> Dashboard: Profile complete

    ProfileSetup --> Dashboard

    %% === AUTHENTICATED USER AREA ===
    state "Authenticated Area" as AuthenticatedArea {
        [*] --> Dashboard

        state "Dashboard" as Dashboard {
            [*] --> ViewDashboard
            ViewDashboard --> RecentRecipes
            ViewDashboard --> FavoriteRecipes
            ViewDashboard --> PublicRecipes
        }

        Dashboard --> RecipeManagement: Manage recipes
        Dashboard --> Collections: View collections
        Dashboard --> ProfileSettings: Edit profile

        %% Recipe Management
        state "Recipe Management" as RecipeManagement {
            [*] --> RecipeList
            RecipeList --> AddRecipe: Add new
            RecipeList --> ViewRecipe: View details
            RecipeList --> SearchFilter: Search

            ViewRecipe --> EditRecipe: Edit
            ViewRecipe --> DeleteRecipe: Delete
            ViewRecipe --> ModifyWithAI: AI modify
            ViewRecipe --> AddToFavorites: Favorite
            ViewRecipe --> AddToCollection: Add to collection

            %% AI Modification
            state "AI Modification" as ModifyWithAI {
                [*] --> SelectModification
                SelectModification --> AdjustCalories
                SelectModification --> IncreaseProtein
                SelectModification --> ChangePortion
                SelectModification --> FindSubstitutes

                AdjustCalories --> PreviewChanges
                IncreaseProtein --> PreviewChanges
                ChangePortion --> PreviewChanges
                FindSubstitutes --> PreviewChanges

                state accept_changes <<choice>>
                PreviewChanges --> accept_changes
                accept_changes --> SaveModified: Accept
                accept_changes --> SelectModification: Reject

                SaveModified --> [*]
            }
        }

        RecipeManagement --> Dashboard: Back

        %% Collections
        state "Collections" as Collections {
            [*] --> CollectionList
            CollectionList --> CreateCollection
            CollectionList --> ViewCollection
            ViewCollection --> ManageRecipes
        }

        Collections --> Dashboard: Back

        %% Profile Settings
        state "Profile Settings" as ProfileSettings {
            [*] --> ViewProfile
            ViewProfile --> EditBasicInfo
            ViewProfile --> EditPreferences
            ViewProfile --> EditGoals
        }

        ProfileSettings --> Dashboard: Back
    }

    %% Logout flow
    AuthenticatedArea --> Logout: Logout

    state "Logout" as Logout {
        [*] --> ClearSession
        ClearSession --> [*]
    }

    Logout --> LandingPage

    %% Public content for unauthenticated users
    state "Public Content" as PublicContent {
        [*] --> BrowsePublicRecipes
        BrowsePublicRecipes --> ViewPublicRecipe

        note right of BrowsePublicRecipes
            Limited access
            No saving or modifying
        end note
    }

    PublicContent --> user_choice: Want full access

    %% Session expiration
    state session_check <<choice>>
    AuthenticatedArea --> session_check: Session check
    session_check --> AuthenticatedArea: Session valid
    session_check --> Login: Session expired
```

---

## Journey Descriptions

### 1. New User Onboarding
New users arrive at the landing page, register with email/password, and are automatically logged in. They're then guided through profile setup where they enter basic information, dietary preferences, and goals. After setup, they land on the personalized dashboard.

### 2. Returning User Access
Existing users go directly to login, enter credentials, and access their dashboard. If their session is still valid, they may skip login entirely.

### 3. Password Recovery
Users who forgot their password can request a reset link via email. After clicking the link, they set a new password and return to login.

### 4. Core App Usage
Authenticated users can:
- **Browse recipes** - View, search, and filter their recipe collection
- **Add recipes** - Create new recipes with ingredients and steps
- **Modify with AI** - Adjust calories, protein, portions, or find substitutes
- **Organize** - Add to favorites or custom collections
- **Manage profile** - Update preferences and goals

### 5. Session Management
The app checks session validity on protected routes. Expired sessions redirect to login while preserving the intended destination.

---

## Key User Stories Covered

| User Story | Journey Coverage |
|------------|------------------|
| US-001: Registration | Registration Process → Auto Login → Profile Setup |
| US-002: Login | Login Process → Dashboard |
| US-003: Password Reset | Password Reset flow |
| US-004: Logout | Logout → Landing Page |
| US-005-008: Profile | Profile Setup composite state |
| US-009-016: Recipes | Recipe Management composite state |
| US-017-020: AI Modify | AI Modification nested state |
| US-028: Dashboard | Dashboard state with sections |
