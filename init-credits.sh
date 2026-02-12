#!/bin/bash

SUPABASE_URL="https://otjnqzqoxdlrkdqzknvi.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90am5xenFveGRscmtkcXprbnZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg4NzUzMywiZXhwIjoyMDg2NDYzNTMzfQ.KiEmjiY56BEdunxU8VOv1oz-XGAjeC3IYW78oDVLFsE"

USER1_ID="1c46468d-6774-49b5-85a6-92f925ba51eb"
USER2_ID="dc39a74e-fd41-4414-9e35-4022b7515539"

echo "Setting up credits for test users..."

# Create profile for user 1
curl -X POST "${SUPABASE_URL}/rest/v1/profiles" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"id\": \"${USER1_ID}\",
    \"character_credits\": 100,
    \"book_credits\": 100,
    \"plan\": \"author\"
  }"

echo ""

# Create profile for user 2
curl -X POST "${SUPABASE_URL}/rest/v1/profiles" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"id\": \"${USER2_ID}\",
    \"character_credits\": 100,
    \"book_credits\": 100,
    \"plan\": \"author\"
  }"

echo -e "\n\n✅ Credits initialized!"
echo "Both users now have 100 character credits + 100 book credits"
