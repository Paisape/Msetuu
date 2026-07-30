const fs = require('fs');
const path = 'F:/Msetuu/docs/USER_APP_API.postman_collection.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Find 'Auth' or 'Authentication' folder or add a new 'Profile & Addresses' folder
let targetFolder = data.item.find(i => i.name.toLowerCase().includes('auth'));
if (!targetFolder) {
  targetFolder = { name: "Profile & Addresses", item: [] };
  data.item.push(targetFolder);
}

const authHeaders = [
  {
    "key": "Authorization",
    "value": "Bearer {{accessToken}}",
    "type": "text"
  }
];

// Profile Endpoints
const profileRequests = [
  {
    "name": "Get Profile",
    "request": {
      "method": "GET",
      "header": authHeaders,
      "url": { "raw": "{{baseUrl}}/profile", "host": ["{{baseUrl}}"], "path": ["profile"] }
    },
    "response": []
  },
  {
    "name": "Update Profile",
    "request": {
      "method": "PUT",
      "header": authHeaders,
      "body": {
        "mode": "raw",
        "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"phone\": \"9876543210\"\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/profile", "host": ["{{baseUrl}}"], "path": ["profile"] }
    },
    "response": []
  }
];

// Addresses Endpoints
const addressesRequests = [
  {
    "name": "Get Addresses",
    "request": {
      "method": "GET",
      "header": authHeaders,
      "url": { "raw": "{{baseUrl}}/addresses", "host": ["{{baseUrl}}"], "path": ["addresses"] }
    },
    "response": []
  },
  {
    "name": "Add Address",
    "request": {
      "method": "POST",
      "header": authHeaders,
      "body": {
        "mode": "raw",
        "raw": "{\n  \"label\": \"Home\",\n  \"fullAddress\": \"123 Main Street\",\n  \"isDefault\": true\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/addresses", "host": ["{{baseUrl}}"], "path": ["addresses"] }
    },
    "response": []
  },
  {
    "name": "Update Address",
    "request": {
      "method": "PATCH",
      "header": authHeaders,
      "body": {
        "mode": "raw",
        "raw": "{\n  \"label\": \"Work\",\n  \"isDefault\": false\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": {
        "raw": "{{baseUrl}}/addresses/:id",
        "host": ["{{baseUrl}}"],
        "path": ["addresses", ":id"],
        "variable": [{ "key": "id", "value": "replace_with_address_id" }]
      }
    },
    "response": []
  },
  {
    "name": "Delete Address",
    "request": {
      "method": "DELETE",
      "header": authHeaders,
      "url": {
        "raw": "{{baseUrl}}/addresses/:id",
        "host": ["{{baseUrl}}"],
        "path": ["addresses", ":id"],
        "variable": [{ "key": "id", "value": "replace_with_address_id" }]
      }
    },
    "response": []
  }
];

// Push the requests into the folder
targetFolder.item.push(...profileRequests);
targetFolder.item.push(...addressesRequests);

fs.writeFileSync(path, JSON.stringify(data, null, 4));
console.log('Postman collection updated successfully!');
