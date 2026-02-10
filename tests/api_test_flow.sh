#!/bin/bash

# Base URL
API="http://127.0.0.1:8000"

echo "1. Registering Creator..."
curl -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{"username": "creator", "password": "password", "role": "creator"}'

echo -e "\n\n2. Logging in Creator..."
TOKEN_RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"username": "creator", "password": "password"}')
TOKEN=$(echo $TOKEN_RESP | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

echo -e "\n\n3. Uploading Asset..."
# Create dummy file
echo "Secret Content" > secret.txt
UPLOAD_RESP=$(curl -s -X POST "$API/asset/upload?token=$TOKEN" -H "accept: application/json" -H "Content-Type: multipart/form-data" -F "file=@secret.txt")
HASH=$(echo $UPLOAD_RESP | grep -o '"asset_hash":"[^"]*"' | cut -d'"' -f4)
ID=1 # Assumption for first asset
echo "Asset Hash: $HASH"

echo -e "\n\n4. Registering Consumer..."
curl -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{"username": "consumer", "password": "password", "role": "user"}'

echo -e "\n\n5. Licensing Consumer..."
curl -X POST "$API/asset/license/issue?token=$TOKEN" -H "Content-Type: application/json" -d "{\"asset_id\": $ID, \"user_username\": \"consumer\", \"expiry_days\": 7, \"access_limit\": 10}"

echo -e "\n\n6. Consumer Download..."
# Login Consumer
CONSUMER_RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"username": "consumer", "password": "password"}')
CONSUMER_TOKEN=$(echo $CONSUMER_RESP | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -X GET "$API/asset/download/$HASH?token=$CONSUMER_TOKEN" --output downloaded.txt
echo "Downloaded content:"
cat downloaded.txt

echo -e "\n\nTests Complete."
rm secret.txt downloaded.txt
