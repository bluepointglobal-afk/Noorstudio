# Code Review Checklist - Universe V2

**Reviewer:** ___________
**Date:** ___________
**Component:** ___________

---

## ✅ General Code Quality

### Readability
- [ ] Code is clear and self-documenting
- [ ] Variable names are descriptive
- [ ] Function names explain their purpose
- [ ] No overly complex logic
- [ ] No magic numbers or strings

### Structure
- [ ] Functions are single-purpose
- [ ] Functions are < 50 lines (ideally)
- [ ] Proper separation of concerns
- [ ] DRY principle followed
- [ ] No code duplication

### Comments
- [ ] Complex logic is commented
- [ ] TODOs are tracked
- [ ] No commented-out code
- [ ] JSDoc for public functions

---

## ✅ TypeScript

### Type Safety
- [ ] All functions have return types
- [ ] All parameters have types
- [ ] No `any` types (unless necessary)
- [ ] Interfaces defined for data structures
- [ ] Enums used for constants

### Type Correctness
- [ ] Types match actual data
- [ ] Optional properties marked with `?`
- [ ] Nullable types handled correctly
- [ ] Generic types used appropriately

---

## ✅ React Components

### Component Structure
- [ ] Props interface defined
- [ ] Default props set (if needed)
- [ ] Hooks at top level
- [ ] No nested components
- [ ] Proper component naming

### State Management
- [ ] State properly initialized
- [ ] State updates immutable
- [ ] useEffect dependencies correct
- [ ] No unnecessary re-renders
- [ ] Memoization where needed

### Event Handlers
- [ ] Event handlers properly typed
- [ ] No inline functions in JSX (if performance matters)
- [ ] Event propagation controlled
- [ ] Form submission prevented when needed

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] Alt text for images

---

## ✅ API Integration

### Error Handling
- [ ] Try-catch blocks present
- [ ] Error messages user-friendly
- [ ] Network errors handled
- [ ] Loading states shown
- [ ] Error states shown

### Data Fetching
- [ ] Loading indicators shown
- [ ] Stale data handled
- [ ] Race conditions prevented
- [ ] Caching considered
- [ ] Pagination implemented (if needed)

### API Calls
- [ ] Proper HTTP methods used
- [ ] Authentication headers included
- [ ] Request timeouts set
- [ ] Response validation
- [ ] Status codes checked

---

## ✅ Database/Backend

### SQL Queries
- [ ] SQL injection prevented
- [ ] Queries use parameters
- [ ] Indexes used appropriately
- [ ] Query performance acceptable
- [ ] No N+1 queries

### Data Validation
- [ ] Input validation present
- [ ] Data sanitized
- [ ] Schema validation
- [ ] Foreign key constraints checked
- [ ] Null checks present

### Transactions
- [ ] Transactions used for multi-step operations
- [ ] Rollback logic present
- [ ] Transaction isolation correct
- [ ] No deadlocks possible

---

## ✅ Performance

### Frontend Performance
- [ ] No unnecessary re-renders
- [ ] Large lists virtualized
- [ ] Images lazy loaded
- [ ] Code splitting used
- [ ] Bundle size acceptable

### Backend Performance
- [ ] Database queries optimized
- [ ] Proper indexes used
- [ ] Caching implemented
- [ ] Connection pooling used
- [ ] No memory leaks

### Network Performance
- [ ] API responses paginated
- [ ] Data compressed
- [ ] Unnecessary requests avoided
- [ ] Request batching used

---

## ✅ Security

### Input Security
- [ ] User input sanitized
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Command injection prevention
- [ ] Path traversal prevention

### Authentication
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Tokens validated
- [ ] Session management secure
- [ ] No credentials in code

### Data Security
- [ ] Sensitive data encrypted
- [ ] PII handled properly
- [ ] No data in logs
- [ ] HTTPS enforced
- [ ] CORS configured correctly

---

## ✅ Error Handling

### Error Messages
- [ ] Errors logged properly
- [ ] User-friendly messages shown
- [ ] Stack traces not exposed (production)
- [ ] Error codes consistent
- [ ] Errors recoverable

### Error Boundaries
- [ ] React error boundaries present
- [ ] Fallback UI defined
- [ ] Errors reported to Sentry
- [ ] User can recover

---

## ✅ Testing

### Test Coverage
- [ ] Unit tests present
- [ ] Integration tests present
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] Happy path tested

### Test Quality
- [ ] Tests are isolated
- [ ] Tests are deterministic
- [ ] Tests are fast
- [ ] Test names descriptive
- [ ] Mocks used appropriately

---

## ✅ Universe V2 Specific

### Universe Management
- [ ] Universe CRUD works
- [ ] Soft delete implemented
- [ ] Book count trigger works
- [ ] Tags searchable
- [ ] Visual/Writing DNA stored correctly

### Asset Management
- [ ] Asset CRUD works
- [ ] Usage count trigger works
- [ ] Approved assets reusable
- [ ] File URLs valid
- [ ] Metadata stored correctly

### Book-Universe Relationship
- [ ] Foreign keys enforced
- [ ] Cascade deletes correct
- [ ] Book presets auto-populate
- [ ] Universe context in generation
- [ ] Asset linking works

### Version Control
- [ ] Version number auto-increments
- [ ] is_current enforced
- [ ] Version restore works
- [ ] Section locking works
- [ ] Change summary captured

---

## ✅ Edge Cases

### Data Edge Cases
- [ ] Empty strings handled
- [ ] Null values handled
- [ ] Very long strings handled
- [ ] Special characters handled
- [ ] Large numbers handled

### UI Edge Cases
- [ ] Empty states shown
- [ ] Loading states shown
- [ ] Error states shown
- [ ] Long text wrapped
- [ ] Many items handled

### User Flow Edge Cases
- [ ] Back button works
- [ ] Refresh works
- [ ] Multiple tabs work
- [ ] Concurrent edits handled
- [ ] Network loss handled

---

## 🐛 Common Issues to Check

### React Pitfalls
- [ ] Missing key prop in lists
- [ ] Mutating state directly
- [ ] Incorrect useEffect dependencies
- [ ] Memory leaks in useEffect
- [ ] Stale closures

### TypeScript Pitfalls
- [ ] Type assertions (as) misused
- [ ] Optional chaining overused
- [ ] Type guards missing
- [ ] Generics too complex
- [ ] Index signatures overused

### Performance Pitfalls
- [ ] Render prop abuse
- [ ] Context overused
- [ ] Expensive calculations in render
- [ ] Large component trees
- [ ] Blocking operations on main thread

### Security Pitfalls
- [ ] Eval usage
- [ ] InnerHTML usage
- [ ] Unvalidated redirects
- [ ] Exposed API keys
- [ ] Hardcoded secrets

---

## 📝 Review Notes

### Strengths
-
-
-

### Issues Found
-
-
-

### Suggestions
-
-
-

### Action Items
- [ ]
- [ ]
- [ ]

---

## ✅ Approval

### Review Status
☐ Approved
☐ Approved with minor changes
☐ Needs changes
☐ Rejected

### Reviewer Signature
___________

### Date
___________

---

**Review Complete:** ☐ Yes  ☐ No
**Follow-up Required:** ☐ Yes  ☐ No
