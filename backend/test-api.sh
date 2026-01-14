#!/bin/bash

# Shaxe API Quick Test Script
# This script demonstrates key API endpoints

BASE_URL="http://localhost:5000/api"
JWT_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Shaxe API Test Suite ===${NC}\n"

# Test 1: Health Check
echo -e "${BLUE}1. Testing Health Check...${NC}"
curl -s http://localhost:5000/health | jq .
echo ""

# Test 2: Signup
echo -e "${BLUE}2. Testing User Signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"test@example.com",
    "password":"password123",
    "dateOfBirth":"2000-01-15"
  }')
echo $SIGNUP_RESPONSE | jq .
JWT_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')
USER_ID=$(echo $SIGNUP_RESPONSE | jq -r '.user.id')
echo -e "${GREEN}Token: $JWT_TOKEN${NC}"
echo -e "${GREEN}User ID: $USER_ID${NC}\n"

# Test 3: Login
echo -e "${BLUE}3. Testing User Login...${NC}"
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }' | jq .
echo ""

# Test 4: Get User Profile
echo -e "${BLUE}4. Testing Get User Profile...${NC}"
curl -s -X GET "$BASE_URL/users/$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 5: Create a Post
echo -e "${BLUE}5. Testing Create Post...${NC}"
POST_RESPONSE=$(curl -s -X POST $BASE_URL/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "content":"Hello Shaxe! This is my first post.",
    "isAdultContent":false
  }')
echo $POST_RESPONSE | jq .
POST_ID=$(echo $POST_RESPONSE | jq -r '.post.id')
echo -e "${GREEN}Post ID: $POST_ID${NC}\n"

# Test 6: Get Single Post
echo -e "${BLUE}6. Testing Get Single Post...${NC}"
curl -s -X GET "$BASE_URL/posts/$POST_ID" | jq .
echo ""

# Test 7: Get Feed
echo -e "${BLUE}7. Testing Get Feed...${NC}"
curl -s -X GET "$BASE_URL/posts/feed?limit=10&offset=0" | jq .
echo ""

# Test 8: Like a Post (requires verified user)
echo -e "${BLUE}8. Testing Like Post...${NC}"
echo "Note: Liking requires verified user. This may fail."
curl -s -X POST "$BASE_URL/engagement/like/$POST_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 9: Get Engagement Stats
echo -e "${BLUE}9. Testing Get Engagement Stats...${NC}"
curl -s -X GET "$BASE_URL/engagement/$POST_ID/stats" | jq .
echo ""

# Test 10: Get User's Posts
echo -e "${BLUE}10. Testing Get User Posts...${NC}"
curl -s -X GET "$BASE_URL/users/$USER_ID/posts" | jq .
echo ""

# Test 11: Ignore a User
echo -e "${BLUE}11. Testing Ignore User...${NC}"
curl -s -X POST "$BASE_URL/users/ignore/999" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 12: Get Shaxe Points Balance
echo -e "${BLUE}12. Testing Get Shaxe Points Balance...${NC}"
curl -s -X GET "$BASE_URL/shaxe-points/balance" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# Test 13: Get Trending Posts
echo -e "${BLUE}13. Testing Get Trending Posts...${NC}"
curl -s -X GET "$BASE_URL/trending/posts?period=week&limit=5" | jq .
echo ""

# Test 14: Get Hall of Fame
echo -e "${BLUE}14. Testing Get Hall of Fame...${NC}"
curl -s -X GET "$BASE_URL/trending/hall-of-fame?period=week&limit=5" | jq .
echo ""

echo -e "${GREEN}=== Tests Complete ===${NC}"
