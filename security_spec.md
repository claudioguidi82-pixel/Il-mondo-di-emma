# Payload-First Security TDD Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Owner Isolation (PII & Child Progress Protection)**: A `/user_progress/{userId}` document can only be read, created, updated, or deleted when `request.auth != null`, `request.auth.token.email_verified == true`, `isValidId(userId)`, and `userId == request.auth.uid`.
2. **Identity Integrity**: `incoming().ownerId` must equal `request.auth.uid` on creation and remain immutable (`incoming().ownerId == existing().ownerId`) on update.
3. **Strict Schema & Volumetric Bounds**: All 19 required keys must be present (`hasAll` and `hasOnly`), with no shadow or extra fields permitted. Every string and array is bounded by `.size()` checks.
4. **Temporal Integrity & Immortal Creation Timestamp**: `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on update; `updatedAt` must equal `request.time` on every write.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/user_progress/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'user_1', token: { email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Cross-User Read (PII Blanket Attack)**: `auth.uid = 'attacker_99'` reading `/user_progress/user_1` -> `PERMISSION_DENIED`.
4. **Cross-User Write (Identity Spoofing)**: `auth.uid = 'user_1'` creating `/user_progress/user_1` with `ownerId: 'victim_2'` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection**: Payload includes extra key `isAdmin: true` -> `PERMISSION_DENIED`.
6. **OwnerId Mutation on Update**: Updating `ownerId` to another UID -> `PERMISSION_DENIED`.
7. **CreatedAt Time Travel on Update**: Modifying `createdAt` during an update -> `PERMISSION_DENIED`.
8. **Client-Forged UpdatedAt Timestamp**: Supplying a past/future `updatedAt` != `request.time` -> `PERMISSION_DENIED`.
9. **Oversized String Resource Poisoning**: `childName` with 500 characters (`> 60`) -> `PERMISSION_DENIED`.
10. **Invalid Enum Value**: `childGender: 'invalid_gender'` -> `PERMISSION_DENIED`.
11. **Array Overflow Attack**: `unlockedStickerIds` with 60 items (`> 40`) -> `PERMISSION_DENIED`.
12. **Collection Enumeration Scraping (`list`)**: Listing `/user_progress` collection across users -> `PERMISSION_DENIED`.
