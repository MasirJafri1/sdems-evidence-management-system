const fs = require('fs');
const path = require('path');

const BASE_URL = "http://localhost:5000";

async function runAllEndpointTests() {
  console.log("=================================================");
  console.log("   AUTOMATED ALL-ENDPOINTS SWAGGER API TESTER    ");
  console.log("=================================================\n");

  const results = [];

  function record(name, endpoint, status, pass, details = "") {
    const symbol = pass ? "✅ PASS" : "❌ FAIL";
    results.push({ name, endpoint, status, pass, details });
    console.log(`${symbol} | ${name} [${endpoint}] -> Status ${status}`);
    if (details) console.log(`   Details: ${details}`);
  }

  // 1. GET /health
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    record("Health Check", "GET /health", res.status, res.status === 200, JSON.stringify(data));
  } catch (err) {
    record("Health Check", "GET /health", 0, false, err.message);
  }

  // 2. POST /api/organizations/bootstrap
  let bootstrapData;
  let ADMIN_TOKEN = "";
  let ORG_ID = "";
  let ADMIN_USER_ID = "";
  const randomSuffix = Math.floor(Math.random() * 100000);
  const adminEmail = `admin_test_${randomSuffix}@forensic.gov`;

  try {
    const res = await fetch(`${BASE_URL}/api/organizations/bootstrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: `Automated Test Lab ${randomSuffix}`,
        organizationCode: `STL-${randomSuffix}`,
        adminName: "Automated Root Admin",
        adminEmail: adminEmail,
        adminPassword: "Password123!"
      })
    });
    bootstrapData = await res.json();
    ORG_ID = bootstrapData.organization?.id;
    ADMIN_USER_ID = bootstrapData.user?.id;
    record("Bootstrap System", "POST /api/organizations/bootstrap", res.status, res.status === 201, `OrgID: ${ORG_ID}`);
  } catch (err) {
    record("Bootstrap System", "POST /api/organizations/bootstrap", 0, false, err.message);
  }

  // 3. POST /api/auth/login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: "Password123!"
      })
    });
    const loginData = await res.json();
    ADMIN_TOKEN = loginData.token;
    record("Admin Login", "POST /api/auth/login", res.status, res.status === 200, `Token received: ${Boolean(ADMIN_TOKEN)}`);
  } catch (err) {
    record("Admin Login", "POST /api/auth/login", 0, false, err.message);
  }

  const authHeader = { Authorization: `Bearer ${ADMIN_TOKEN}` };
  const jsonAuthHeader = { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` };

  // 4. POST /api/organizations/:organizationId/roles
  let ROLE_ID = "";
  try {
    const res = await fetch(`${BASE_URL}/api/organizations/${ORG_ID}/roles`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        name: `Investigator Role ${randomSuffix}`,
        description: "Full case and document management",
        permissionNames: ["CASE_READ", "CASE_UPDATE", "DOCUMENT_UPLOAD", "EVIDENCE_CREATE"]
      })
    });
    const roleData = await res.json();
    ROLE_ID = roleData.id;
    record("Create Role", `POST /api/organizations/${ORG_ID}/roles`, res.status, res.status === 201, `RoleID: ${ROLE_ID}`);
  } catch (err) {
    record("Create Role", `POST /api/organizations/${ORG_ID}/roles`, 0, false, err.message);
  }

  // 5. POST /api/organizations/:organizationId/users
  let USER_ID_2 = "";
  let USER_2_TOKEN = "";
  const investigatorEmail = `investigator_${randomSuffix}@forensic.gov`;
  try {
    const res = await fetch(`${BASE_URL}/api/organizations/${ORG_ID}/users`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        name: "Detective Sarah Smith",
        email: investigatorEmail,
        password: "Password123!",
        roleId: ROLE_ID
      })
    });
    const userData = await res.json();
    USER_ID_2 = userData.id;
    record("Create User", `POST /api/organizations/${ORG_ID}/users`, res.status, res.status === 201, `UserID: ${USER_ID_2}`);

    // Login user 2
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: investigatorEmail, password: "Password123!" })
    });
    const login2Data = await loginRes.json();
    USER_2_TOKEN = login2Data.token;
  } catch (err) {
    record("Create User", `POST /api/organizations/${ORG_ID}/users`, 0, false, err.message);
  }

  // 6. GET /api/organizations/:organizationId/users
  try {
    const res = await fetch(`${BASE_URL}/api/organizations/${ORG_ID}/users`, { headers: authHeader });
    const users = await res.json();
    record("Get Organization Users", `GET /api/organizations/${ORG_ID}/users`, res.status, res.status === 200, `Count: ${users.length}`);
  } catch (err) {
    record("Get Organization Users", `GET /api/organizations/${ORG_ID}/users`, 0, false, err.message);
  }

  // 7. POST /api/organizations/:organizationId/cases
  let CASE_ID = "";
  try {
    const res = await fetch(`${BASE_URL}/api/organizations/${ORG_ID}/cases`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        caseNumber: `CASE-2026-${randomSuffix}`,
        title: "Automated Forensics Investigation",
        description: "Comprehensive end-to-end evidence verification test case",
        status: "OPEN"
      })
    });
    const caseData = await res.json();
    CASE_ID = caseData.id;
    record("Create Case", `POST /api/organizations/${ORG_ID}/cases`, res.status, res.status === 201, `CaseID: ${CASE_ID}`);
  } catch (err) {
    record("Create Case", `POST /api/organizations/${ORG_ID}/cases`, 0, false, err.message);
  }

  // 8. GET /api/organizations/:organizationId/cases
  try {
    const res = await fetch(`${BASE_URL}/api/organizations/${ORG_ID}/cases`, { headers: authHeader });
    const cases = await res.json();
    record("List Organization Cases", `GET /api/organizations/${ORG_ID}/cases`, res.status, res.status === 200, `Count: ${cases.length}`);
  } catch (err) {
    record("List Organization Cases", `GET /api/organizations/${ORG_ID}/cases`, 0, false, err.message);
  }

  // 9. GET /api/cases/:caseId
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${CASE_ID}`, { headers: authHeader });
    const caseData = await res.json();
    record("Get Case By ID", `GET /api/cases/${CASE_ID}`, res.status, res.status === 200, `Title: "${caseData.title}"`);
  } catch (err) {
    record("Get Case By ID", `GET /api/cases/${CASE_ID}`, 0, false, err.message);
  }

  // 10. POST /api/cases/:caseId/participants
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${CASE_ID}/participants`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        userId: USER_ID_2,
        isCaseAdmin: false
      })
    });
    const participant = await res.json();
    record("Add Case Participant", `POST /api/cases/${CASE_ID}/participants`, res.status, res.status === 201, `Participant added: ${participant.userId}`);
  } catch (err) {
    record("Add Case Participant", `POST /api/cases/${CASE_ID}/participants`, 0, false, err.message);
  }

  // 11. POST /api/cases/:caseId/documents (FormData upload)
  let DOCUMENT_ID = "";
  let VERSION_ID = "";
  try {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const fileContent = "Cryptographic Evidence Test Payload Content - SHA256 Verification";
    const body = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="title"\r\n\r\nHard Drive Analysis Log\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="description"\r\n\r\nExtracted raw forensic disk log file\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="documentType"\r\n\r\nFORENSIC_LOG\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="disk_extraction.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n${fileContent}\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/api/cases/${CASE_ID}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${ADMIN_TOKEN}`
      },
      body: body
    });
    const docData = await res.json();
    DOCUMENT_ID = docData.document?.id || docData.id;
    VERSION_ID = docData.version?.id || docData.versions?.[0]?.id;
    record("Upload Document", `POST /api/cases/${CASE_ID}/documents`, res.status, res.status === 201 || res.status === 200, `DocID: ${DOCUMENT_ID}`);
  } catch (err) {
    record("Upload Document", `POST /api/cases/${CASE_ID}/documents`, 0, false, err.message);
  }

  // 12. GET /api/cases/:caseId/documents
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${CASE_ID}/documents`, { headers: authHeader });
    const docs = await res.json();
    record("List Case Documents", `GET /api/cases/${CASE_ID}/documents`, res.status, res.status === 200, `Count: ${docs.length}`);
  } catch (err) {
    record("List Case Documents", `GET /api/cases/${CASE_ID}/documents`, 0, false, err.message);
  }

  // 13. POST /api/documents/:documentId/versions
  try {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const fileContentV2 = "Cryptographic Evidence Revision 2 Payload Content - Appended section";
    const body = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="changeSummary"\r\n\r\nAppended memory dump section\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="disk_extraction_v2.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n${fileContentV2}\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/api/documents/${DOCUMENT_ID}/versions`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${ADMIN_TOKEN}`
      },
      body: body
    });
    const v2Data = await res.json();
    if (v2Data.id) VERSION_ID = v2Data.id;
    record("Create Document Version (v2)", `POST /api/documents/${DOCUMENT_ID}/versions`, res.status, res.status === 201 || res.status === 200, `Version Number: ${v2Data.versionNumber || 2}`);
  } catch (err) {
    record("Create Document Version (v2)", `POST /api/documents/${DOCUMENT_ID}/versions`, 0, false, err.message);
  }

  // 14. GET /api/documents/:documentId/versions/:versionNumber/download
  try {
    const res = await fetch(`${BASE_URL}/api/documents/${DOCUMENT_ID}/versions/1/download`, { headers: authHeader });
    record("Download Version 1", `GET /api/documents/${DOCUMENT_ID}/versions/1/download`, res.status, res.status === 200 || res.status === 302, "Download stream/link generated");
  } catch (err) {
    record("Download Version 1", `GET /api/documents/${DOCUMENT_ID}/versions/1/download`, 0, false, err.message);
  }

  // 15. GET /api/blockchain/health
  try {
    const res = await fetch(`${BASE_URL}/api/blockchain/health`, { headers: authHeader });
    const health = await res.json();
    record("Blockchain Health", "GET /api/blockchain/health", res.status, res.status === 200, `Contract: ${health.contractAddress || health.status}`);
  } catch (err) {
    record("Blockchain Health", "GET /api/blockchain/health", 0, false, err.message);
  }

  // 16. GET /api/document-versions/:versionId/blockchain
  try {
    const res = await fetch(`${BASE_URL}/api/document-versions/${VERSION_ID}/blockchain`, { headers: authHeader });
    const anchorInfo = await res.json();
    record("Get Blockchain Anchor Proof", `GET /api/document-versions/${VERSION_ID}/blockchain`, res.status, res.status === 200, `Status: ${anchorInfo.status || 'OK'}`);
  } catch (err) {
    record("Get Blockchain Anchor Proof", `GET /api/document-versions/${VERSION_ID}/blockchain`, 0, false, err.message);
  }

  // 17. GET /api/document-versions/:versionId/verify
  try {
    const res = await fetch(`${BASE_URL}/api/document-versions/${VERSION_ID}/verify`, { headers: authHeader });
    const verifyData = await res.json();
    record("Cryptographic Verification", `GET /api/document-versions/${VERSION_ID}/verify`, res.status, res.status === 200, `Verified: ${verifyData.verified}`);
  } catch (err) {
    record("Cryptographic Verification", `GET /api/document-versions/${VERSION_ID}/verify`, 0, false, err.message);
  }

  // 18. POST /api/evidence (Physical Evidence)
  let EVIDENCE_ID = "";
  try {
    const res = await fetch(`${BASE_URL}/api/evidence`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        caseId: CASE_ID,
        documentVersionId: VERSION_ID,
        evidenceNumber: `EVID-${randomSuffix}`,
        title: "Encrypted Kingston USB Drive",
        description: "128GB USB drive seized at scene",
        storageLocation: "Vault 3 Locker A"
      })
    });
    const evidenceData = await res.json();
    EVIDENCE_ID = evidenceData.evidence?.id || evidenceData.id;
    record("Register Physical Evidence", "POST /api/evidence", res.status, res.status === 201, `EvidenceID: ${EVIDENCE_ID}`);
  } catch (err) {
    record("Register Physical Evidence", "POST /api/evidence", 0, false, err.message);
  }

  // 19. POST /api/evidence/:evidenceId/transfers
  let TRANSFER_ID = "";
  try {
    const res = await fetch(`${BASE_URL}/api/evidence/${EVIDENCE_ID}/transfers`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        toUserId: USER_ID_2,
        reason: "Handing over USB drive to Analyst for data extraction"
      })
    });
    const transferData = await res.json();
    TRANSFER_ID = transferData.transfer?.id || transferData.id;
    record("Initiate Custody Transfer", `POST /api/evidence/${EVIDENCE_ID}/transfers`, res.status, res.status === 201, `TransferID: ${TRANSFER_ID}`);
  } catch (err) {
    record("Initiate Custody Transfer", `POST /api/evidence/${EVIDENCE_ID}/transfers`, 0, false, err.message);
  }

  // 20. POST /api/transfers/:transferId/accept
  try {
    const res = await fetch(`${BASE_URL}/api/transfers/${TRANSFER_ID}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${USER_2_TOKEN}` }
    });
    const acceptData = await res.json();
    record("Accept Custody Transfer", `POST /api/transfers/${TRANSFER_ID}/accept`, res.status, res.status === 200, `Status: ${acceptData.message || acceptData.status || 'ACCEPTED'}`);
  } catch (err) {
    record("Accept Custody Transfer", `POST /api/transfers/${TRANSFER_ID}/accept`, 0, false, err.message);
  }

  // 21. GET /api/evidence/:evidenceId/custody-history/verify
  try {
    const res = await fetch(`${BASE_URL}/api/evidence/${EVIDENCE_ID}/custody-history/verify`, { headers: authHeader });
    const verifyCustody = await res.json();
    record("Verify Custody Chain", `GET /api/evidence/${EVIDENCE_ID}/custody-history/verify`, res.status, res.status === 200, `isValid: ${verifyCustody.isValid}`);
  } catch (err) {
    record("Verify Custody Chain", `GET /api/evidence/${EVIDENCE_ID}/custody-history/verify`, 0, false, err.message);
  }

  // 22. GET /api/cases/:caseId/audit
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${CASE_ID}/audit`, { headers: authHeader });
    const auditEvents = await res.json();
    record("Fetch Case Audit Trail", `GET /api/cases/${CASE_ID}/audit`, res.status, res.status === 200, `Events logged: ${auditEvents.events?.length || auditEvents.length}`);
  } catch (err) {
    record("Fetch Case Audit Trail", `GET /api/cases/${CASE_ID}/audit`, 0, false, err.message);
  }

  // 23. GET /api/cases/:caseId/audit/verify
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${CASE_ID}/audit/verify`, { headers: authHeader });
    const auditChain = await res.json();
    record("Verify Audit Chain Integrity", `GET /api/cases/${CASE_ID}/audit/verify`, res.status, res.status === 200, `isValid: ${auditChain.isValid}`);
  } catch (err) {
    record("Verify Audit Chain Integrity", `GET /api/cases/${CASE_ID}/audit/verify`, 0, false, err.message);
  }

  // 24. GET /api/authorization/cases/:caseId/permissions/check
  try {
    const res = await fetch(`${BASE_URL}/api/authorization/cases/${CASE_ID}/permissions/check?permission=DOCUMENT_READ`, { headers: authHeader });
    const checkResult = await res.json();
    record("ABAC Permission Check", `GET /api/authorization/cases/${CASE_ID}/permissions/check`, res.status, res.status === 200, `Allowed: ${checkResult.allowed}`);
  } catch (err) {
    record("ABAC Permission Check", `GET /api/authorization/cases/${CASE_ID}/permissions/check`, 0, false, err.message);
  }

  // 25. POST /api/authorization/cases/:caseId/permissions
  try {
    const res = await fetch(`${BASE_URL}/api/authorization/cases/${CASE_ID}/permissions`, {
      method: "POST",
      headers: jsonAuthHeader,
      body: JSON.stringify({
        userId: USER_ID_2,
        permissionName: "DOCUMENT_READ",
        effect: "DENY"
      })
    });
    const overrideResult = await res.json();
    record("Grant ABAC Override", `POST /api/authorization/cases/${CASE_ID}/permissions`, res.status, res.status === 201 || res.status === 200, `Effect: ${overrideResult.permission?.effect || 'DENY'}`);
  } catch (err) {
    record("Grant ABAC Override", `POST /api/authorization/cases/${CASE_ID}/permissions`, 0, false, err.message);
  }

  // 26. GET /api/authorization/cases/:caseId/users/:userId/permissions
  try {
    const res = await fetch(`${BASE_URL}/api/authorization/cases/${CASE_ID}/users/${USER_ID_2}/permissions`, { headers: authHeader });
    const userPerms = await res.json();
    record("List User Case Permissions", `GET /api/authorization/cases/${CASE_ID}/users/${USER_ID_2}/permissions`, res.status, res.status === 200, `Total Rules: ${userPerms.permissions?.length || 1}`);
  } catch (err) {
    record("List User Case Permissions", `GET /api/authorization/cases/${CASE_ID}/users/${USER_ID_2}/permissions`, 0, false, err.message);
  }

  console.log("\n=================================================");
  console.log("                 TEST SUMMARY                    ");
  console.log("=================================================");
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  console.log(`TOTAL ENDPOINTS TESTED : ${total}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log(`PASS RATE              : ${((passed / total) * 100).toFixed(1)}%`);
  console.log("=================================================\n");
}

runAllEndpointTests().catch(console.error);
