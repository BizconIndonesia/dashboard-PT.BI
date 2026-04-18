# Security Specification - PT.LHL Operations Dashboard

## Data Invariants
1. `ChatMessage`: Must have an author whose `userId` matches the authenticated user's `uid`. Messages cannot be edited or deleted by users.
2. `DailyRecord`: Records production data. Only authenticated users can read. Updates/Deletes should be restricted (for now, allowed for signed-in users, but schema-validated).
3. IDs must be sanitized to prevent ID poisoning.
4. Timestamps must use `request.time`.

## The Dirty Dozen (Vulnerability Test Cases)
1. **Identity Spoofing (Chat)**: User A tries to send a message with `userId: "UserB"`.
2. **Anonymous Write**: Unauthenticated user tries to add a daily record.
3. **ID Poisoning**: User tries to create a record with an ID that is 2KB in size.
4. **Schema Violation**: User tries to save a `DailyRecord` with a string in the `ob.actual` field.
5. **PII Leak**: A list query that doesn't filter by a valid relational owner (if applicable).
6. **Shadow Field Injection**: User tries to add `isAdmin: true` to their ChatMessage.
7. **Negative Productivity**: User tries to save productivity values less than 0.
8. **Future Timestamp**: User tries to set a `timestamp` in the future (not using server time).
9. **Mass Deletion**: Authenticated user tries to delete all messages using a wildcard delete.
10. **Record Hijacking**: User A tries to modify a DailyRecord created by the system/admin (if ownership is implemented).
11. **Type Confusion**: Sending an array where a number is expected in an update.
12. **Out of Bounds**: Productivity value > 1,000,000 (sanity check).

## Validation Plans
- `isValidChatMessage(data)`: Strictly enforces keys, types, and length.
- `isValidDailyRecord(data)`: Enforces nesting and numeric boundaries.
