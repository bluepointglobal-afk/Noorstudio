# DATA MODEL

> ROLE: ARCHITECTURE  
> ⛔ REQUIRES: Gate 2 passed

---

## Entities

### Entity: [Name]
```
{
  id: string (primary key)
  created_at: timestamp
  updated_at: timestamp
  
  // Fields
  field1: type
  field2: type
}
```

**Relationships:**
- Has many: [Entity]
- Belongs to: [Entity]

---

## Database Choice

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| PostgreSQL | | | |
| MongoDB | | | |
| SQLite | | | |

**Selected:** [choice] because [reason]

---

## Indexes

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| | | | |

---

## Migrations

Migration strategy: [describe]
