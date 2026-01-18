# API Validation Adapter

## Persona
Developer from SCOPE.md

## Scenarios
- authentication → first call
- core endpoint usage
- error handling

## Execution
- cURL / Postman / SDK tests
- Rate limit testing
- Error response verification

## Evaluation
Score each dimension (0-100):
- **Documentation clarity:** Can a dev integrate in 15 minutes?
- **Response quality:** Are responses well-structured and complete?
- **Error handling:** Are errors informative and actionable?
- **Performance:** Are response times acceptable?
- **Developer experience:** Is the API pleasant to use?

## Output
- VALIDATION_REPORT.md
- SCORE.json
- GAP_REPORT.md (if needed)

## Threshold
80%

---

## Example Scenarios for API

### Scenario 1: Auth → First Successful Call
1. Obtain API key / token
2. Make authenticated request
3. Receive valid response

**Pass criteria:** Working request in under 5 minutes with docs

### Scenario 2: Core Endpoint Usage
1. Call primary endpoint with realistic data
2. Verify response structure
3. Parse and use response

**Pass criteria:** Response matches documented schema

### Scenario 3: Error Handling
1. Send malformed request
2. Send unauthorized request
3. Exceed rate limits

**Pass criteria:** Each error returns clear, actionable message

### Technical Checks
- [ ] All endpoints return JSON with consistent structure
- [ ] HTTP status codes are correct
- [ ] Rate limiting headers present
- [ ] Response times < 500ms for standard calls
- [ ] OpenAPI/Swagger spec matches implementation
