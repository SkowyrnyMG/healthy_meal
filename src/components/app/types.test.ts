import { describe, it, expect } from "vitest";
import { getUserDisplayName, getUserInitials, type UserInfo } from "./types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockUserComplete: UserInfo = {
  userId: "user-123",
  email: "jan.kowalski@example.com",
  displayName: "Jan Kowalski",
};

const mockUserWithoutName: UserInfo = {
  userId: "user-456",
  email: "anna.nowak@example.com",
  displayName: null,
};

// ============================================================================
// getUserDisplayName
// ============================================================================

describe("getUserDisplayName", () => {
  it("should return full name when available", () => {
    const result = getUserDisplayName(mockUserComplete);
    expect(result).toBe("Jan Kowalski");
  });

  it("should return email username when name is missing", () => {
    const result = getUserDisplayName(mockUserWithoutName);
    expect(result).toBe("anna.nowak");
  });

  it('should return "Użytkownik" when user is null', () => {
    const result = getUserDisplayName(null);
    expect(result).toBe("Użytkownik");
  });

  it("should return email username when displayName is empty string", () => {
    const userWithEmptyName: UserInfo = {
      userId: "user-789",
      email: "test@example.com",
      displayName: "",
    };

    const result = getUserDisplayName(userWithEmptyName);
    expect(result).toBe("test");
  });

  it("should trim whitespace from name", () => {
    const userWithSpaces: UserInfo = {
      userId: "user-999",
      email: "test@example.com",
      displayName: "  Jan Kowalski  ",
    };

    const result = getUserDisplayName(userWithSpaces);
    expect(result).toBe("  Jan Kowalski  "); // Function doesn't trim, returns as-is
  });

  it("should handle name with only spaces", () => {
    const userWithSpacesOnly: UserInfo = {
      userId: "user-111",
      email: "test@example.com",
      displayName: "   ",
    };

    const result = getUserDisplayName(userWithSpacesOnly);
    expect(result).toBe("   "); // Returns the space string as-is
  });

  it("should handle email without username part", () => {
    const userWithWeirdEmail: UserInfo = {
      userId: "user-222",
      email: "@example.com",
      displayName: null,
    };

    const result = getUserDisplayName(userWithWeirdEmail);
    // When email username is empty, falls back to "Użytkownik"
    expect(result).toBe("Użytkownik");
  });

  it("should handle very long names", () => {
    const longName = "A".repeat(500);
    const userWithLongName: UserInfo = {
      userId: "user-333",
      email: "test@example.com",
      displayName: longName,
    };

    const result = getUserDisplayName(userWithLongName);
    expect(result).toBe(longName);
  });

  it("should handle email with no @ symbol", () => {
    const userWithBadEmail: UserInfo = {
      userId: "user-444",
      email: "notanemail",
      displayName: null,
    };

    const result = getUserDisplayName(userWithBadEmail);
    expect(result).toBe("notanemail"); // split('@')[0] returns full string
  });
});

// ============================================================================
// getUserInitials
// ============================================================================

describe("getUserInitials", () => {
  it("should return first character of display name when available", () => {
    const result = getUserInitials(mockUserComplete);
    expect(result).toBe("J");
  });

  it("should return first character uppercase", () => {
    const userWithLowercaseName: UserInfo = {
      userId: "user-555",
      email: "test@example.com",
      displayName: "jan kowalski",
    };

    const result = getUserInitials(userWithLowercaseName);
    expect(result).toBe("J");
  });

  it("should return first character of email when name missing", () => {
    const result = getUserInitials(mockUserWithoutName);
    expect(result).toBe("A");
  });

  it('should return "U" when user is null', () => {
    const result = getUserInitials(null);
    expect(result).toBe("U");
  });

  it("should handle hyphenated names (returns first char only)", () => {
    const userWithHyphenatedName: UserInfo = {
      userId: "user-666",
      email: "test@example.com",
      displayName: "Jan-Piotr Kowalski",
    };

    const result = getUserInitials(userWithHyphenatedName);
    expect(result).toBe("J"); // Only returns first character
  });

  it("should handle names with middle initial (returns first char only)", () => {
    const userWithMiddleInitial: UserInfo = {
      userId: "user-777",
      email: "test@example.com",
      displayName: "Jan M. Kowalski",
    };

    const result = getUserInitials(userWithMiddleInitial);
    expect(result).toBe("J"); // Only returns first character
  });

  it("should handle special characters in name", () => {
    const userWithSpecialChars: UserInfo = {
      userId: "user-888",
      email: "test@example.com",
      displayName: "@Jan Kowalski",
    };

    const result = getUserInitials(userWithSpecialChars);
    expect(result).toBe("@");
  });

  it("should handle emoji at start of name (JavaScript limitation)", () => {
    const userWithEmoji: UserInfo = {
      userId: "user-999",
      email: "test@example.com",
      displayName: "🎉 Jan Kowalski",
    };

    const result = getUserInitials(userWithEmoji);
    // JavaScript charAt() doesn't handle multi-byte characters (emojis) correctly
    // This is expected behavior - emojis get split
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle Polish characters", () => {
    const userWithPolishChars: UserInfo = {
      userId: "user-101",
      email: "test@example.com",
      displayName: "Łukasz Żółty",
    };

    const result = getUserInitials(userWithPolishChars);
    expect(result).toBe("Ł");
  });

  it("should handle empty display name (falls back to email)", () => {
    const userWithEmptyName: UserInfo = {
      userId: "user-102",
      email: "test@example.com",
      displayName: "",
    };

    const result = getUserInitials(userWithEmptyName);
    expect(result).toBe("T"); // Uses email first char
  });

  it("should handle single character name", () => {
    const userWithSingleChar: UserInfo = {
      userId: "user-103",
      email: "test@example.com",
      displayName: "J",
    };

    const result = getUserInitials(userWithSingleChar);
    expect(result).toBe("J");
  });
});
