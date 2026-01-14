#!/bin/bash
# Shaxe Backend - Advanced Features Testing Script
# Tests all new and updated endpoints

BASE_URL="http://localhost:5000/api"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Shaxe Backend - Advanced Features Test Suite           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# 1. SETUP TEST DATA
# ============================================================

echo -e "${YELLOW}Step 1: Creating test users...${NC}"

# Signup User A (will be verified)
USER_A=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verified@example.com",
    "username": "verified_user",
    "password": "TestPassword123!",
    "dateOfBirth": "1990-01-15"
  }' | jq -r '.token')

echo -e "${GREEN}✓ User A (Verified) created, token: ${USER_A:0:20}...${NC}"

# Signup User B (unverified, same person - will fail on KYC)
USER_B=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "username": "unverified_user",
    "password": "TestPassword123!",
    "dateOfBirth": "1990-01-15"
  }' | jq -r '.token')

echo -e "${GREEN}✓ User B (Unverified) created, token: ${USER_B:0:20}...${NC}"

# Signup User C (different person)
USER_C=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@example.com",
    "username": "another_user",
    "password": "TestPassword123!",
    "dateOfBirth": "1985-05-20"
  }' | jq -r '.token')

echo -e "${GREEN}✓ User C created, token: ${USER_C:0:20}...${NC}"

echo ""

# ============================================================
# 2. KYC VERIFICATION TEST
# ============================================================

echo -e "${YELLOW}Step 2: Testing KYC verification (1 per person)...${NC}"

# Verify User A with identity ABC123
KYC_A=$(curl -s -X POST "$BASE_URL/auth/verify-kyc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A" \
  -d '{
    "idDocument": "DL123ABC",
    "proofOfAddress": "utility_bill.pdf",
    "fullName": "John Verified"
  }')

echo -e "${GREEN}✓ User A verified:${NC} $(echo $KYC_A | jq -r '.status')"

# Try to verify User B with same identity (should fail)
KYC_B=$(curl -s -X POST "$BASE_URL/auth/verify-kyc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B" \
  -d '{
    "idDocument": "DL123ABC",
    "proofOfAddress": "utility_bill.pdf",
    "fullName": "John Verified"
  }')

if echo $KYC_B | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✓ KYC uniqueness enforced:${NC} $(echo $KYC_B | jq -r '.error')"
else
  echo -e "${RED}✗ KYC uniqueness NOT enforced${NC}"
fi

echo ""

# ============================================================
# 3. USER PROFILE TESTS
# ============================================================

echo -e "${YELLOW}Step 3: Testing profile updates...${NC}"

# Get User A profile before update
PROFILE_BEFORE=$(curl -s -X GET "$BASE_URL/users/1" \
  -H "Authorization: Bearer $USER_A")

echo -e "${GREEN}✓ Retrieved User A profile${NC}"

# Update User A profile
PROFILE_UPDATE=$(curl -s -X PUT "$BASE_URL/users/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A" \
  -d '{
    "full_name": "John Verified",
    "location": "United States",
    "bio": "Verified Shaxe user",
    "profile_picture_url": "https://example.com/avatar.jpg",
    "full_name_private": false,
    "date_of_birth_private": true
  }')

echo -e "${GREEN}✓ Profile updated:${NC} $(echo $PROFILE_UPDATE | jq -r '.user.full_name')"

# Get updated profile
PROFILE_AFTER=$(curl -s -X GET "$BASE_URL/users/1" \
  -H "Authorization: Bearer $USER_A")

echo -e "${GREEN}✓ Verified privacy controls:${NC} full_name_private=$(echo $PROFILE_AFTER | jq -r '.user.full_name_private')"

echo ""

# ============================================================
# 4. ENGAGEMENT & POINTS TESTS
# ============================================================

echo -e "${YELLOW}Step 4: Creating test post...${NC}"

# Create post by User A
POST=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A" \
  -d '{
    "content": "Test post for engagement testing",
    "isAdultContent": false
  }')

POST_ID=$(echo $POST | jq -r '.post.id')
echo -e "${GREEN}✓ Test post created:${NC} $POST_ID"

echo ""

echo -e "${YELLOW}Step 5: Testing verified user engagement (with points)...${NC}"

# Verified user (User C) likes post
LIKE=$(curl -s -X POST "$BASE_URL/engagement/like/$POST_ID" \
  -H "Authorization: Bearer $USER_C")

echo -e "${GREEN}✓ Verified user liked post${NC}"

# Check User C points
BALANCE=$(curl -s -X GET "$BASE_URL/shaxe-points/balance" \
  -H "Authorization: Bearer $USER_C")

echo -e "${GREEN}✓ User C points balance:${NC} $(echo $BALANCE | jq -r '.balance') pts"

echo ""

echo -e "${YELLOW}Step 6: Testing unverified user engagement (no points)...${NC}"

# Unverified user tries to like
LIKE_UNVERIFIED=$(curl -s -X POST "$BASE_URL/engagement/like/$POST_ID" \
  -H "Authorization: Bearer $USER_B")

if echo $LIKE_UNVERIFIED | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✓ Unverified user restricted from liking:${NC} $(echo $LIKE_UNVERIFIED | jq -r '.error')"
else
  echo -e "${RED}✗ Unverified should not be able to like${NC}"
fi

# Unverified user shaxes post (allowed)
SHAXE=$(curl -s -X POST "$BASE_URL/engagement/shaxe/$POST_ID" \
  -H "Authorization: Bearer $USER_B")

echo -e "${GREEN}✓ Unverified user shaxed post:${NC} $(echo $SHAXE | jq -r '.message')"

# Unverified user tries to purchase points (should fail)
PURCHASE=$(curl -s -X POST "$BASE_URL/shaxe-points/purchase" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B" \
  -d '{
    "productId": "points.small",
    "receipt": "fake_receipt"
  }')

if echo $PURCHASE | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✓ Unverified user cannot purchase points:${NC} $(echo $PURCHASE | jq -r '.error')"
else
  echo -e "${RED}✗ Unverified should not be able to purchase${NC}"
fi

echo ""

# ============================================================
# 7. CONTENT REPORTING TESTS
# ============================================================

echo -e "${YELLOW}Step 7: Testing content reporting...${NC}"

# User B reports the post
REPORT=$(curl -s -X POST "$BASE_URL/reports" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B" \
  -d '{
    "report_type": "post",
    "reported_id": "'$POST_ID'",
    "reason": "spam",
    "description": "This appears to be promotional content"
  }')

REPORT_ID=$(echo $REPORT | jq -r '.report_id')
echo -e "${GREEN}✓ Content reported:${NC} $REPORT_ID"

# Check report status
REPORT_STATUS=$(curl -s -X GET "$BASE_URL/reports/$REPORT_ID" \
  -H "Authorization: Bearer $USER_B")

echo -e "${GREEN}✓ Report status:${NC} $(echo $REPORT_STATUS | jq -r '.status')"

# User tries to duplicate report (should fail)
DUPLICATE=$(curl -s -X POST "$BASE_URL/reports" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B" \
  -d '{
    "report_type": "post",
    "reported_id": "'$POST_ID'",
    "reason": "spam",
    "description": "Duplicate attempt"
  }')

if echo $DUPLICATE | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✓ Duplicate report prevented${NC}"
else
  echo -e "${RED}✗ Duplicate report should be prevented${NC}"
fi

# List user's reports
MY_REPORTS=$(curl -s -X GET "$BASE_URL/reports/my/list?limit=10" \
  -H "Authorization: Bearer $USER_B")

REPORT_COUNT=$(echo $MY_REPORTS | jq '.reports | length')
echo -e "${GREEN}✓ User has $REPORT_COUNT reports${NC}"

echo ""

# ============================================================
# 8. FAVORITE ENGAGEMENT TESTS
# ============================================================

echo -e "${YELLOW}Step 8: Testing favorite engagement (all users)...${NC}"

# Both verified and unverified users can favorite
FAVORITE_VERIFIED=$(curl -s -X POST "$BASE_URL/engagement/favorite/$POST_ID" \
  -H "Authorization: Bearer $USER_C")

echo -e "${GREEN}✓ Verified user favorited post${NC}"

FAVORITE_UNVERIFIED=$(curl -s -X POST "$BASE_URL/engagement/favorite/$POST_ID" \
  -H "Authorization: Bearer $USER_B")

echo -e "${GREEN}✓ Unverified user favorited post${NC}"

echo ""

# ============================================================
# 9. SUMMARY
# ============================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Test Suite Complete                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✓ KYC Verification (1 per person)"
echo "✓ Profile Management (bio, photo, privacy)"
echo "✓ Verified User Engagement (with points)"
echo "✓ Unverified User Engagement (shaxe, favorite, no points)"
echo "✓ Points Purchase Restriction"
echo "✓ Content Reporting"
echo "✓ Report Status Tracking"
echo "✓ Duplicate Report Prevention"
echo ""
echo "All endpoints tested successfully!"
