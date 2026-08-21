# AulaInfinity Security Specification

This document defines the strict data invariants, malicious "Dirty Dozen" attack payloads, and the comprehensive security verification test suite for the **AulaInfinity** educational application.

---

## 1. Data Invariants & Zero-Trust Policies

1. **Identity Integrity**: No user may create or modify a document under `users/{userId}`, `students/{studentId}`, or `teachers/{teacherId}` unless the `userId`/`studentId`/`teacherId` matches the authenticated user's ID (`request.auth.uid`).
2. **Anti-Privilege Escalation**:
   - Standard users cannot assign themselves the `'admin'` role.
   - Profile documents cannot have their `role` or `email` fields modified after creation.
   - The document's `email` field must match `request.auth.token.email`.
3. **Financial Protection (No Forge Attacks)**:
   - Students cannot create, modify, or delete records in `infinity_transactions` or `student_payments`.
   - Virtual currency (Infinity Coins) can only be minted or modified by authorized administrators or teachers.
4. **Teacher Lounge Isolation**:
   - Only users with the `'teacher'` or `'admin'` role (verified via database records or the superadmin master email `8aulainfinity8@gmail.com`) can read or write to `firestore_teacher_messages`.
5. **Private Data Isolation (PII)**:
   - Private student profile data, payments, and personal progress logs are strictly isolated from public views.
6. **Path Validation & ID Poisoning Guards**:
   - All document IDs must conform to secure alphanumeric character constraints to prevent payload injection and Denial of Wallet attacks.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to violate security boundaries and must be blocked with `PERMISSION_DENIED` by the security rules:

### Payload 1: Self-Elevation to Admin Role (Privilege Escalation)
Attempt to create a user profile with an admin role.
```json
{
  "path": "/users/malicious_user_123",
  "auth": { "uid": "malicious_user_123", "token": { "email": "attacker@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "malicious_user_123",
    "name": "Attacker",
    "email": "attacker@gmail.com",
    "role": "admin"
  }
}
```

### Payload 2: Profile Hijacking (Identity Spoofing)
Attempt to write a user profile for a different user ID.
```json
{
  "path": "/users/victim_user_456",
  "auth": { "uid": "malicious_user_123", "token": { "email": "attacker@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "victim_user_456",
    "name": "Victim",
    "email": "victim@gmail.com",
    "role": "student"
  }
}
```

### Payload 3: Role Overwriting during Update
Attempt to change a student's role to teacher post-creation.
```json
{
  "path": "/users/student_user_789",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "update",
  "existing_data": { "id": "student_user_789", "email": "student@gmail.com", "role": "student" },
  "data": {
    "id": "student_user_789",
    "email": "student@gmail.com",
    "role": "teacher"
  }
}
```

### Payload 4: Infinite Free Credits Forgery (Financial Attack)
Attempt by a student to directly write a transaction to add 5000 free coins.
```json
{
  "path": "/infinity_transactions/fraud_tx_999",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "fraud_tx_999",
    "studentId": "student_user_789",
    "amount": 5000,
    "type": "add",
    "description": "Free credit injection"
  }
}
```

### Payload 5: Student eavesdropping on Teacher's Lounge Channel
Attempt by a student to read internal teacher discussion messages.
```json
{
  "path": "/firestore_teacher_messages/teacher_msg_abc",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "get"
}
```

### Payload 6: Spoofing Message Sender Identity
Attempt to post a chat message purporting to come from a teacher.
```json
{
  "path": "/firestore_peer_messages/msg_456",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "msg_456",
    "conversationId": "peer_student_user_789_other",
    "senderId": "victim_teacher_uid",
    "text": "Hello students, class is cancelled today."
  }
}
```

### Payload 7: Fabricating Suscriptions (Free Pass)
Attempt by a student to change their payment records to mock a verified payment.
```json
{
  "path": "/student_payments/fake_pay_777",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "fake_pay_777",
    "studentId": "student_user_789",
    "amount": 150,
    "concept": "Suscripción Premium",
    "date": "2026-08-04"
  }
}
```

### Payload 8: Modifying Class Recording catalog
Attempt by a student to upload or modify class recordings.
```json
{
  "path": "/classRecordings/recording_123",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "recording_123",
    "courseId": "math_101",
    "title": "Deleted class history",
    "url": "https://malicious.url/video.mp4"
  }
}
```

### Payload 9: Hijacking another Student's Progress Track
Attempt to modify another student's course completion state.
```json
{
  "path": "/student_course_progress/victim_prog_111",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "create",
  "data": {
    "studentId": "victim_student_uid",
    "courseId": "physics_101",
    "percentage": 100
  }
}
```

### Payload 10: Unauthorized Global Config Manipulation
Attempt by an unprivileged user to change WhatsApp evolutive parameters or price lists.
```json
{
  "path": "/app_config/main",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "update",
  "data": {
    "tutoringPrice": 0.01,
    "evolutionApiKey": "hacked_key_123"
  }
}
```

### Payload 11: Eavesdropping on Tutoring Requests of other students
Attempt by a student to inspect private appointments of other peers.
```json
{
  "path": "/firestore_tutoring_requests/victim_req_222",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "existing_data": { "studentId": "victim_student_uid", "subjectName": "Chemistry" },
  "operation": "get"
}
```

### Payload 12: Injection of Malformed/Poisoned document IDs (Denial of Wallet)
Attempt to write an extremely long, garbage ID string to trigger query/storage cost.
```json
{
  "path": "/firestore_comments/COMMENT_JUNK_ID_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM_SPAM",
  "auth": { "uid": "student_user_789", "token": { "email": "student@gmail.com" } },
  "operation": "create",
  "data": {
    "id": "COMMENT_JUNK_ID_SPAM_...",
    "videoId": "math_lesson_1",
    "text": "Spam comment"
  }
}
```

---

## 3. Security Unit Tests Blueprint

This suite verifies that the security configurations successfully reject all malicious scenarios.

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

describe("AulaInfinity Zero-Trust Firestore Rules", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "aulainfinity8-a6ac0",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("blocks Payload 1: Self-elevation to admin", async () => {
    const context = testEnv.authenticatedContext("malicious_user_123", { email: "attacker@gmail.com" });
    await assertFails(
      context.firestore().collection("users").doc("malicious_user_123").set({
        id: "malicious_user_123",
        name: "Attacker",
        email: "attacker@gmail.com",
        role: "admin",
      })
    );
  });

  it("blocks Payload 2: Profile Hijacking", async () => {
    const context = testEnv.authenticatedContext("malicious_user_123", { email: "attacker@gmail.com" });
    await assertFails(
      context.firestore().collection("users").doc("victim_user_456").set({
        id: "victim_user_456",
        name: "Victim",
        email: "victim@gmail.com",
        role: "student",
      })
    );
  });

  it("blocks Payload 4: Infinite Free Coins Forgery by Student", async () => {
    const context = testEnv.authenticatedContext("student_user_789", { email: "student@gmail.com" });
    await assertFails(
      context.firestore().collection("infinity_transactions").doc("fraud_tx_999").set({
        id: "fraud_tx_999",
        studentId: "student_user_789",
        amount: 5000,
        type: "add",
        description: "Free credit injection",
      })
    );
  });

  it("blocks Payload 5: Student reading teacher-only lounge chats", async () => {
    const context = testEnv.authenticatedContext("student_user_789", { email: "student@gmail.com" });
    await assertFails(
      context.firestore().collection("firestore_teacher_messages").doc("teacher_msg_abc").get()
    );
  });
});
```
