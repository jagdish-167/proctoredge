# ProctorEdge Security Specification

## 1. Data Invariants
- A User profile must match the `request.auth.uid`.
- An Exam must have a `creatorId` matching the authenticated user's UID.
- An Incident must belong to an existing Exam.
- An Incident's `studentId` must match the authenticated user's UID (unless written by system).
- Only the specified admin (`jagdishsolunke02@gmail.com`) can see all incidents and exams.

## 2. The "Dirty Dozen" Payloads (Red Team)
1. **Identity Spoofing**: Attempt to create a user profile with another user's UID.
2. **Privilege Escalation**: Attempt to set `role: 'admin'` on own user profile.
3. **Cross-User Read**: Student A attempts to read Student B's incidents.
4. **Orphaned Exam**: Create an exam with a fake `creatorId`.
5. **Exam Modification**: Student attempts to change the `sourceType` of an exam they didn't create.
6. **Incident Injection**: Attacker attempts to create an incident for another student.
7. **Severity Tampering**: Student attempts to downgrade an incident's severity from `CRITICAL` to `MINIMAL`.
8. **Resource Exhaustion**: Send 1MB of junk data in `description` field.
9. **Timestamp Spoofing**: Provide a `createdAt` in the past.
10. **ID Poisoning**: Use a 2KB string as a document ID.
11. **Shadow Field**: Add `isVerified: true` to a create payload.
12. **Status Locking Bypass**: Modify an exam's status after it has been archived.

## 3. Test Runner
(Will be implemented in `firestore.rules.test.ts` if environment supports, otherwise I'll proceed to drafting rules).
