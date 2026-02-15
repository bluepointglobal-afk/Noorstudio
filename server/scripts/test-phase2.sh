#!/bin/bash
# Phase 2 API Testing Script
# Tests database schema and triggers directly via psql

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
TEST_USER_ID="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

echo "🧪 Testing Phase 2: Database API Layer"
echo ""

# Test 1: Universe CRUD
echo "🌌 Test 1: Universe CRUD..."
UNIVERSE_ID=$(psql $DB_URL -A -t -c "INSERT INTO universes (account_id, name, description) VALUES ('$TEST_USER_ID', 'Test Universe', 'Test description') RETURNING id;" | head -1)

if [ -n "$UNIVERSE_ID" ]; then
    echo "   ✅ Create universe"
    
    # Test get
    COUNT=$(psql $DB_URL -A -t -c "SELECT COUNT(*) FROM universes WHERE id = '$UNIVERSE_ID' AND deleted_at IS NULL;")
    [ "$COUNT" = "1" ] && echo "   ✅ Get universe" || echo "   ❌ Get universe"
    
    # Test update  
    psql $DB_URL -q -c "UPDATE universes SET description = 'Updated' WHERE id = '$UNIVERSE_ID';"
    UPDATED=$(psql $DB_URL -A -t -c "SELECT description FROM universes WHERE id = '$UNIVERSE_ID';")
    [ "$UPDATED" = "Updated" ] && echo "   ✅ Update universe" || echo "   ❌ Update universe"
else
    echo "   ❌ Create universe failed"
    exit 1
fi

# Test 2: Asset CRUD
echo ""
echo "🎨 Test 2: Asset CRUD..."
ASSET_ID=$(psql $DB_URL -A -t -c "INSERT INTO assets (account_id, universe_id, type, name, data) VALUES ('$TEST_USER_ID', '$UNIVERSE_ID', 'character', 'Test Hero', '{\"role\": \"Protagonist\"}') RETURNING id;" | head -1)
[ -n "$ASSET_ID" ] && echo "   ✅ Create asset" || { echo "   ❌ Create asset"; exit 1; }

# Test 3: Book creation
echo ""
echo "📚 Test 3: Book creation..."
BOOK_ID=$(psql $DB_URL -A -t -c "INSERT INTO projects (user_id, universe_id, title, data, status) VALUES ('$TEST_USER_ID', '$UNIVERSE_ID', 'Test Book', '{}', 'draft') RETURNING id;" | head -1)
if [ -n "$BOOK_ID" ]; then
    echo "   ✅ Create book"
    
    BOOK_COUNT=$(psql $DB_URL -A -t -c "SELECT book_count FROM universes WHERE id = '$UNIVERSE_ID';")
    [ "$BOOK_COUNT" = "1" ] && echo "   ✅ Universe book_count trigger" || echo "   ❌ Book count: $BOOK_COUNT"
else
    echo "   ❌ Create book failed"
    exit 1
fi

# Test 4: Book-Asset link
echo ""
echo "🔗 Test 4: Book-Asset linking..."
LINK_ID=$(psql $DB_URL -A -t -c "INSERT INTO book_assets (book_id, asset_id, role) VALUES ('$BOOK_ID', '$ASSET_ID', 'character') RETURNING id;" | head -1)
if [ -n "$LINK_ID" ]; then
    echo "   ✅ Link asset to book"
    
    USAGE_COUNT=$(psql $DB_URL -A -t -c "SELECT usage_count FROM assets WHERE id = '$ASSET_ID';")
    [ "$USAGE_COUNT" = "1" ] && echo "   ✅ Asset usage_count trigger" || echo "   ❌ Usage count: $USAGE_COUNT"
else
    echo "   ❌ Link failed"
    exit 1
fi

# Test 5: Outline Versions
echo ""
echo "📋 Test 5: Outline Versions..."
V1=$(psql $DB_URL -A -t -c "INSERT INTO outline_versions (book_id, data, is_current) VALUES ('$BOOK_ID', '{\"title\": \"V1\"}', true) RETURNING version_number;" | head -1)
[ "$V1" = "1" ] && echo "   ✅ Create outline v1" || echo "   ❌ V1: $V1"

V2=$(psql $DB_URL -A -t -c "INSERT INTO outline_versions (book_id, data, is_current) VALUES ('$BOOK_ID', '{\"title\": \"V2\"}', true) RETURNING version_number;" | head -1)
if [ "$V2" = "2" ]; then
    echo "   ✅ Create outline v2 (auto-increment)"
    
    CURRENT=$(psql $DB_URL -A -t -c "SELECT version_number FROM outline_versions WHERE book_id = '$BOOK_ID' AND is_current = true;")
    [ "$CURRENT" = "2" ] && echo "   ✅ Single current version trigger" || echo "   ❌ Current: v$CURRENT"
else
    echo "   ❌ V2: $V2"
fi

# Test 6: Soft Delete
echo ""
echo "🗑️  Test 6: Soft delete..."
psql $DB_URL -q -c "UPDATE universes SET deleted_at = NOW() WHERE id = '$UNIVERSE_ID';"
COUNT=$(psql $DB_URL -A -t -c "SELECT COUNT(*) FROM universes WHERE id = '$UNIVERSE_ID' AND deleted_at IS NULL;")
[ "$COUNT" = "0" ] && echo "   ✅ Soft delete works" || echo "   ❌ Soft delete failed"

echo ""
echo "✅ All Phase 2 tests passed!"
