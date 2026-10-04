# Data model

```mermaid
erDiagram
    Programme ||--o{ Module : has
    Programme ||--o{ Student : enrols
    Student ||--o| StudentFee : "owes (1 snapshot)"
    Student ||--o{ Payment : "pays (append-only ledger)"
    Module ||--o{ Assessment : sets
    Student ||--o{ Submission : uploads
    Assessment ||--o{ Submission : receives
    Student ||--o{ Grade : earns
    Assessment ||--o{ Grade : "is marked by"
    StudentIdCounter {
        int year PK
        int lastSeq
    }
    Programme {
        string code UK
        int defaultFee "minor units"
    }
    Student {
        string studentNumber UK "SMS-2025-0001"
        string email UK
        enum status "ENROLLED DEFERRED WITHDRAWN COMPLETED"
    }
    StudentFee {
        int amount "snapshot of programme fee"
        datetime dueDate
    }
    Payment {
        int amount "must be > 0"
        string reference UK
        datetime voidedAt "null = counts"
    }
    Submission {
        bool isLate "server clock"
        string studentId_assessmentId UK
    }
    Grade {
        decimal score "0 to 100, CHECK"
        bool published "students see only true"
        string studentId_assessmentId UK
    }
```

Things that are deliberately NOT columns:

- **Outstanding balance**: always `fee - sum(non-voided payments)`.
- **Classification**: always computed from `score` (Fail < 40, Pass >= 40, Merit >= 60, Distinction >= 70).
- **Overdue**: always `balance > 0 AND dueDate < now`.
