/**
 * Phase 0 & Phase 5 Verification Specification for Firestore Security Rules
 * Validates that all 12 "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenScenario {
  id: string;
  title: string;
  authUid: string | null;
  emailVerified: boolean;
  targetPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SECURITY_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 'dd_01_unauthenticated_write',
    title: 'Unauthenticated Write Attempt',
    authUid: null,
    emailVerified: false,
    targetPath: '/user_progress/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_02_unverified_email_spoof',
    title: 'Unverified Email Spoof Attack',
    authUid: 'user_1',
    emailVerified: false,
    targetPath: '/user_progress/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_03_cross_user_read',
    title: 'Cross-User Read (PII Blanket Attack)',
    authUid: 'attacker_99',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_04_identity_spoofing_owner_id',
    title: 'Cross-User Write (ownerId Mismatch)',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_05_shadow_field_injection',
    title: 'Shadow Field Injection (isAdmin: true)',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_06_owner_id_mutation',
    title: 'Immortal ownerId Mutation on Update',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_07_created_at_time_travel',
    title: 'Immortal createdAt Mutation on Update',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_08_forged_updated_at',
    title: 'Client-Forged updatedAt Timestamp',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_09_oversized_string_poisoning',
    title: 'Oversized String Resource Poisoning (childName > 60 chars)',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_10_invalid_gender_enum',
    title: 'Invalid Enum Value Injection (childGender)',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_11_array_overflow_attack',
    title: 'Array Overflow Attack (unlockedStickerIds > 40)',
    authUid: 'user_1',
    emailVerified: true,
    targetPath: '/user_progress/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'dd_12_collection_scraping_list',
    title: 'Cross-Account Collection Enumeration Scraping',
    authUid: 'attacker_99',
    emailVerified: true,
    targetPath: '/user_progress',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
