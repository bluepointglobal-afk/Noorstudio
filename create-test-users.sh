#!/bin/bash

SUPABASE_URL="https://otjnqzqoxdlrkdqzknvi.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90am5xenFveGRscmtkcXprbnZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg4NzUzMywiZXhwIjoyMDg2NDYzNTMzfQ.KiEmjiY56BEdunxU8VOv1oz-XGAjeC3IYW78oDVLFsE"

echo "Creating test user 1: test1@noorstudio.com"
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@noorstudio.com",
    "password": "TestPass123!",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Test User 1"
    }
  }' | python3 -m json.tool

echo -e "\n\nCreating test user 2: test2@noorstudio.com"
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@noorstudio.com",
    "password": "TestPass123!",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Test User 2"
    }
  }' | python3 -m json.tool

echo -e "\n\n=== Test Users Created ==="
echo "User 1: test1@noorstudio.com / TestPass123!"
echo "User 2: test2@noorstudio.com / TestPass123!"
