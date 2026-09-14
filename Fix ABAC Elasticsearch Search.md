# Fix ABAC Elasticsearch Search

*Sep 14, 2026, 6:06 PM · gpt-5-6*
Yes. I inspected the uploaded project ZIP rather than guessing from the architecture. There are **two distinct architectural problems** here:

1. **ABAC/RBAC + organization scoping is inconsistent in multiple places.**
2. **Elasticsearch indexing/search is incomplete, and the file extractor is far too weak for real document-content search.**

The good news: you **do not need to rewrite the whole project**. The problems are concentrated in a manageable set of files.

---

# 1. ABAC / Organization Authorization - where the mess actually is

Your intended model is:

```text
SUPER ADMIN
   │
   └── GLOBAL SCOPE
       ├── All Organizations
       ├── All Users
       ├── All Cases
       ├── All Documents
       ├── All Evidence
       └── All Audit Logs


ORG ADMIN
   │
   └── ORGANIZATION SCOPE
       ├── Everything in Org A
       ├── Users in Org A
       ├── Cases in Org A
       ├── Documents in Org A
       ├── Evidence in Org A
       └── Audit logs in Org A


USER
   │
   ├── Org A → Role X
   ├── Org B → Role Y
   └── Case participation / explicit permissions
```

And critically:

> **A User is global, but their role is membership-specific.**

So:

```text
User
  ├── Membership → Org A → ADMIN
  ├── Membership → Org B → INVESTIGATOR
  └── Membership → Org C → VIEWER
```

That part of your Prisma schema is actually capable of supporting the model.

The problem is your authorization code doesn't consistently use it.

---

# 🔴 Problem 1 - `checkCasePermission()` is fundamentally wrong for Org Admin

### File

```text
backend/src/modules/authorization/authorization.service.ts
```

### Current code around `checkCasePermission()`

You do:

```ts
const participant = await prisma.caseParticipant.findUnique(...)
```

and then:

```ts
if (!participant || participant.status !== "ACTIVE") {
    return {
        allowed: false,
        reason: "User is not an active case participant",
        source: "NONE"
    };
}
```

**before checking organization membership.**

That means your logic is effectively:

```text
User
 ↓
Must be CaseParticipant
 ↓
Then check permissions
```

But your desired logic is:

```text
SuperAdmin?
 ↓ yes → ALLOW

No
 ↓
Is user an ADMIN of case's organization?
 ↓ yes → ALLOW

No
 ↓
Is user an active case participant?
 ↓ yes → evaluate case permissions / role permissions

No → DENY
```

### This is probably your single biggest ABAC bug.

An organization admin should be able to see:

```text
Org A
 ├── Case 1
 ├── Case 2
 ├── Case 3
 └── Case 4
```

without being explicitly inserted into all four `CaseParticipant` records.

---

# 🔴 Problem 2 - You use `memberships[0]`

### File

```text
backend/src/modules/search/scope.resolver.ts
```

This is particularly bad:

```ts
const activeOrgMembership = memberships[0] || null;
```

Then:

```ts
const isOrgAdmin = Boolean(
  activeOrgMembership &&
    (
      activeOrgMembership.role?.name === "ADMIN" ||
      activeOrgMembership.roleId.toLowerCase().includes("admin")
    )
);
```

This breaks your exact requirement:

> A person can be represented in multiple org and can admin multiple org.

Example:

```text
User: Rahul

Org A → ADMIN
Org B → INVESTIGATOR
Org C → ADMIN
```

Your code picks:

```text
memberships[0]
```

and effectively pretends that this is the user's organization/role.

That's not valid authorization.

---

# 🔴 Problem 3 - `organizationId` is stored as ONE value in the search scope

Your scope interface:

```ts
export interface UserSearchScope {
  userId: string;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  organizationId: string | null;
  allowedCaseIds: string[];
}
```

This model itself is wrong for multi-org users.

You need something closer to:

```ts
export interface UserSearchScope {
  userId: string;
  isSuperAdmin: boolean;

  adminOrganizationIds: string[];
  memberOrganizationIds: string[];

  allowedCaseIds: string[];
}
```

Or, even better, a more explicit authorization context:

```ts
export interface AuthorizationContext {
  userId: string;

  isSuperAdmin: boolean;

  memberships: {
    organizationId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  }[];

  adminOrganizationIds: string[];
  memberOrganizationIds: string[];

  allowedCaseIds: string[];
}
```

Then authorization becomes deterministic.

---

# 🔴 Problem 4 - Hardcoded Super Admin email

This appears in multiple places:

```ts
user.email === "superadmin@gov.in"
```

I found this pattern in:

```text
backend/src/modules/authorization/authorization.service.ts
backend/src/modules/search/scope.resolver.ts
backend/src/modules/organizations/organization.controller.ts
backend/src/modules/cases/case.controller.ts
backend/src/modules/documents/document.controller.ts
backend/src/modules/evidence/evidence.controller.ts
backend/src/modules/audit/audit.controller.ts
```

This is fragile.

You currently don't actually have a global system role in the database.

Your `seed.ts` literally creates:

```text
System Super Admin
```

as a standalone user with no organization.

So you're using:

```text
email == superadmin@gov.in
```

as the authorization mechanism.

That's not ABAC.

### Better

Add a system-level role/flag.

For example:

```prisma
model User {
  ...
  systemRole SystemRole?
}

enum SystemRole {
  SUPER_ADMIN
}
```

Then:

```ts
user.systemRole === "SUPER_ADMIN"
```

Even better architecturally, you can have:

```text
SYSTEM_ROLE
    SUPER_ADMIN

ORG_ROLE
    ADMIN
    INVESTIGATOR
    OFFICER
    VIEWER
```

---

# 🔴 Problem 5 - `getCaseMembership()` duplicates and conflicts with ABAC

### File

```text
backend/src/modules/documents/document.controller.ts
```

You have:

```ts
async function getCaseMembership(userId: string, caseId: string)
```

and again:

```ts
const participant = await prisma.caseParticipant.findUnique(...)
```

followed by:

```ts
if (!participant || participant.status !== "ACTIVE") {
    return null;
}
```

This means even if you fix:

```text
authorization.service.ts
```

your documents can **still reject Org Admins**.

For example:

```http
GET /api/cases/:caseId/documents
```

calls:

```ts
const access = await getCaseMembership(...)
```

So the request dies before the proper authorization system gets a chance to work.

### Fix

Delete the authorization logic duplication.

Controllers should do something like:

```ts
await requirePermission(userId, {
    resource: "CASE",
    resourceId: caseId,
    permission: "DOCUMENT_READ"
});
```

and let the centralized authorization engine determine:

```text
SUPER ADMIN
OR
ORG ADMIN
OR
CASE PARTICIPANT + permission
```

---

# 🔴 Problem 6 - Evidence has the same problem

### File

```text
backend/src/modules/evidence/evidence.controller.ts
```

For example `getEvidence()` does:

```ts
const participant = await prisma.caseParticipant.findUnique(...)
```

and:

```ts
if (!participant || participant.status !== "ACTIVE") {
    return 403;
}
```

Again:

```text
Org Admin
    ↓
Owns organization
    ↓
Not case participant
    ↓
403
```

That violates your intended model.

---

# 🔴 Problem 7 - Audit authorization is also independently implemented

### File

```text
backend/src/modules/audit/audit.controller.ts
```

You have another authorization implementation involving:

```ts
myOrgIds
myCaseIds
checkCaseAccess()
```

So you effectively have:

```text
Authorization system #1
authorization.service.ts

Authorization system #2
document.controller.ts

Authorization system #3
evidence.controller.ts

Authorization system #4
audit.controller.ts

Authorization system #5
search/scope.resolver.ts

Authorization system #6
organization.controller.ts
```

That's why the ABAC feels "messy".

### This is the architectural fix I recommend

Make **ONE authorization engine**.

Something like:

```text
src/modules/authorization/

    authorization.service.ts
    authorization.context.ts
    authorization.policy.ts
    authorization.resource.ts
    authorization.types.ts
```

Every controller calls the same engine.

---

# 2. The correct authorization decision tree

I would implement this exact order.

## Step 1 - Load user

```text
User exists?
    ↓
Active?
    ↓
No → DENY
```

---

## Step 2 - Super Admin

```text
systemRole === SUPER_ADMIN
        ↓
      ALLOW
```

No organization or case filtering.

This gives:

```text
ALL organizations
ALL users
ALL cases
ALL documents
ALL evidence
ALL audit logs
```

---

## Step 3 - Determine resource organization

For:

```text
Case
Document
Evidence
Audit
```

resolve:

```text
resource
   ↓
case
   ↓
organization
```

Example:

```text
Document
   ↓
Document.caseId
   ↓
Case.organizationId
```

---

## Step 4 - Find membership specifically in that organization

This is the key.

**Never:**

```ts
findFirst({
    where: { userId }
})
```

Instead:

```ts
findUnique({
    where: {
        userId_organizationId: {
            userId,
            organizationId
        }
    }
})
```

Now:

```text
User
 ├── Org A ADMIN
 ├── Org B OFFICER
 └── Org C ADMIN
```

works correctly.

---

## Step 5 - Org Admin gets organization-wide access

```text
membership.organizationId === resource.organizationId
AND
membership.role === ADMIN
```

→ full access.

No CaseParticipant required.

---

## Step 6 - Normal user

Then check:

```text
CaseParticipant
```

followed by:

```text
CasePermission
```

and:

```text
Organization Role Permission
```

---

# 3. Your Prisma schema is mostly suitable

Interestingly, I **wouldn't radically change the schema**.

This:

```prisma
model OrganizationMembership {
  userId
  organizationId
  roleId

  @@unique([userId, organizationId])
}
```

is exactly what allows:

```text
User → Org A → Admin
User → Org B → Investigator
User → Org C → Admin
```

So the fundamental DB relationship is good.

The problem is primarily **authorization resolution**, not the membership schema.

---

# 4. Elasticsearch - this is the second major red flag

There is a very clear reason your document-content search isn't reliable.

---

# 🔴 Problem 8 - New document uploads are NOT indexed

### File

```text
backend/src/modules/documents/document.controller.ts
```

After:

```ts
await prisma.document.create(...)
```

and:

```ts
await prisma.documentVersion.create(...)
```

you never call:

```ts
indexEntityInElasticsearch(...)
```

I checked the entire backend.

`indexEntityInElasticsearch()` is only being called from:

```text
server.ts
search.routes.ts
```

not the document upload flow.

So your workflow is effectively:

```text
Upload document
      ↓
S3
      ↓
PostgreSQL
      ↓
DONE
```

but Elasticsearch doesn't automatically get the new content.

It only gets indexed when:

```text
server starts
```

or:

```http
POST /api/search/reindex
```

That alone explains a huge portion of the search problem.

---

# 🔴 Problem 9 - Version uploads aren't indexed either

Same issue with:

```text
POST /api/documents/:documentId/versions
```

You create the new version:

```ts
DocumentVersion.create(...)
```

but don't extract its text and re-index the document.

So imagine:

```text
Document v1

"John visited Mumbai"
```

Then upload v2:

```text
"John visited Ahmedabad"
```

Postgres:

```text
v2 ✓
```

S3:

```text
v2 ✓
```

Elasticsearch:

```text
v1 ❌
```

or possibly no document at all.

That's a serious consistency issue.

---

# 🔴 Problem 10 - Your extractor does NOT support "anything"

### File

```text
backend/src/modules/search/extractor.service.ts
```

Currently it explicitly supports:

```text
TXT
MD
CSV
JSON
LOG
XML
HTML
PDF
```

PDF extraction is custom-written.

Everything else falls through to:

```ts
extractPrintableStrings(buffer)
```

That's **not document extraction**.

For example:

```text
.docx
.xlsx
.pptx
.odt
.rtf
```

are structured/binary formats.

Running:

```ts
buffer.toString("latin1")
```

against them doesn't reliably retrieve their actual textual content.

So this:

```text
"Search for the phrase inside this Word document"
```

will fail or produce garbage depending on the file.

---

# 🔴 Problem 11 - Your PDF parser is too fragile

This part:

```ts
/\(([^)]+)\)\s*Tj/g
```

only catches simplistic PDF text operators.

Real PDFs can contain:

```text
compressed streams
TJ arrays
escaped strings
font encodings
ToUnicode mappings
CID fonts
ligatures
positioned text
embedded fonts
scanned images
```

And importantly:

### Scanned PDF

```text
PDF
 └── image
      └── no text layer
```

Your extractor:

```text
PDF parser
    ↓
no text
    ↓
printable strings fallback
    ↓
nothing useful
```

For OCR, you need an OCR pipeline.

---

# 🔴 Problem 12 - Your search fallback doesn't search file contents

This is another very important issue.

In:

```text
backend/src/modules/search/search.service.ts
```

your Postgres fallback searches Documents using:

```ts
title
description
documentType
```

Specifically:

```ts
OR: [
    { title: { contains: qLower } },
    { description: { contains: qLower } },
    { documentType: { contains: qLower } }
]
```

It **cannot search the actual uploaded file**.

So if Elasticsearch fails:

```text
Search "blood pressure 180"
```

and that phrase exists only inside:

```text
report.pdf
```

your fallback returns:

```text
0
```

even though the document contains the phrase.

---

# 5. There is also a subtle Elasticsearch query problem

Your query uses:

```ts
multi_match
```

with:

```ts
fields: [
  "title^3",
  "title.ngram^2",
  "content",
  "summary^2",
  "serialNumber^4",
  "caseNumber^3",
  "evidenceType^2",
  "tags^2"
]
```

That's okay as a baseline.

But your `tags` mapping is:

```ts
tags: { type: "keyword" }
```

and:

```ts
caseNumber: { type: "keyword" }
serialNumber: { type: "keyword" }
```

So these aren't analyzed as normal natural-language text.

For literal identifier search that's fine.

But don't treat every field as if it's equivalent to `content`.

---

# 6. Your content mapping itself is fine

This:

```ts
content: { type: "text" }
```

is not the primary problem.

Elasticsearch **can absolutely search document content** with this mapping.

The problem is:

```text
How content gets into Elasticsearch
```

not primarily:

```text
How Elasticsearch searches content
```

Your pipeline is currently:

```text
File
 ↓
S3
 ↓
Extractor
 ↓
content
 ↓
Elasticsearch
```

but that pipeline is only reliably executed during:

```text
server boot
```

and:

```text
manual /reindex
```

---

# 7. The indexing architecture should be changed

I recommend creating:

```text
backend/src/modules/search/document-indexer.service.ts
```

with something like the conceptual flow:

```text
indexDocument(documentId)
        │
        ├── Load Document
        │
        ├── Load latest DocumentVersion
        │
        ├── Download S3 object
        │
        ├── Detect MIME/type
        │
        ├── Extract text
        │
        ├── OCR if required
        │
        ├── Normalize text
        │
        ├── Generate embedding
        │
        └── Index into Elasticsearch
```

Then call this **every time a version changes**.

---

# 8. What I would change in your files

Here is the exact fix map.

| File | Problem | Fix |
|---|---|---|
| `modules/authorization/authorization.service.ts` | Participant required before Org Admin | **Major rewrite** |
| `modules/search/scope.resolver.ts` | `memberships[0]` | **Major rewrite** |
| `middleware/authorization.ts` | Case-centric authorization | Refactor around centralized context |
| `middleware/resource-authorization.ts` | Depends on old case model | Refactor |
| `modules/documents/document.controller.ts` | Duplicate membership logic | Remove / centralize |
| `modules/evidence/evidence.controller.ts` | Duplicate participant checks | Remove / centralize |
| `modules/audit/audit.controller.ts` | Separate scope implementation | Centralize |
| `modules/cases/case.controller.ts` | Separate org/role checks | Centralize |
| `modules/organizations/organization.controller.ts` | Hardcoded SuperAdmin + local role logic | Centralize |
| `modules/search/search.service.ts` | Search/indexing logic mixed together | Split indexing + querying |
| `modules/search/extractor.service.ts` | Weak extraction | Replace/expand |
| `modules/search/elastic.client.ts` | Mapping can be improved | Improve analyzer/mapping |
| `modules/search/search.routes.ts` | Reindex contains business logic | Move to indexer service |
| `server.ts` | Huge boot-time indexing logic | Replace with index/reconciliation service |

---

# 9. I would specifically NOT rewrite these

Your:

```text
OrganizationMembership
Role
RolePermission
Permission
CaseParticipant
CasePermission
```

relationships are actually useful.

Don't throw them away.

The issue is the authorization **decision layer**.

---

# 10. Target authorization architecture

I'd make it:

```text
                     ┌───────────────────┐
                     │ Authenticated User │
                     └─────────┬─────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │ Authorization Context  │
                  └────────────┬───────────┘
                               │
             ┌─────────────────┼──────────────────┐
             ▼                 ▼                  ▼
       Super Admin       Org Membership       Case Access
             │                 │                  │
             │                 ▼                  ▼
             │           Org + Role          Participant
             │                 │                  │
             │                 ▼                  ▼
             │          Role Permissions     Case Permissions
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Authorization       │
                    │ Decision            │
                    └──────────┬──────────┘
                               ▼
                       ALLOW / DENY
```

Then **every route uses this**.

---

# 11. Search architecture I recommend

Your final pipeline should be:

```text
                 UPLOAD
                   │
                   ▼
                 S3
                   │
                   ▼
             DocumentVersion
                   │
                   ▼
             Text Extraction
                   │
        ┌──────────┴───────────┐
        │                      │
    Text PDF              Scanned PDF
        │                      │
        │                     OCR
        │                      │
        └──────────┬───────────┘
                   ▼
             Normalized Text
                   │
             ┌─────┴─────┐
             ▼           ▼
          BM25        Embedding
             │           │
             └─────┬─────┘
                   ▼
            Elasticsearch
```

Then search:

```text
User query
    │
    ├── lexical/BM25
    │
    ├── fuzzy/identifier
    │
    └── semantic/vector
             │
             ▼
       Security filter
             │
             ▼
      Ranked results
```

And **security filtering must happen inside Elasticsearch**, exactly like you're already attempting to do.

---

# 12. One particularly important security correction

Your current search scope for Org Admin:

```ts
mustFilters.push({
    term: {
        organizationId: scope.organizationId
    }
});
```

is conceptually correct.

But because:

```ts
scope.organizationId
```

comes from:

```ts
memberships[0]
```

you can get this:

```text
User

Org A → ADMIN
Org B → ADMIN

memberships[0] → Org A
```

Then searching Org B while operating as that user can produce incorrect behavior.

The scope needs to support:

```ts
organizationId IN [
    orgA,
    orgB
]
```

for a user who is admin of both.

For Elasticsearch that becomes:

```ts
{
  terms: {
    organizationId: adminOrganizationIds
  }
}
```

---

# 13. Another important issue: Org Admin ≠ global Admin

Your current checks often do things like:

```ts
orgMembership.role.name.toLowerCase().includes("admin")
```

That's dangerous.

You should distinguish:

```text
SUPER_ADMIN
```

from:

```text
ORG_ADMIN
```

and potentially:

```text
CASE_ADMIN
```

These are different scopes.

### Correct hierarchy

```text
SUPER_ADMIN
    GLOBAL

ORG_ADMIN
    ORGANIZATION

CASE_ADMIN
    CASE

USER / INVESTIGATOR
    PARTICIPATION + PERMISSIONS
```

---

# 14. The exact priority I recommend

When checking a resource:

```text
1. Is user active?
       ↓
2. Super Admin?
       ↓ yes
      ALLOW

3. Resolve resource's organization
       ↓
4. Does user have ACTIVE membership in that org?
       ↓
5. Is that membership ORG_ADMIN?
       ↓ yes
      ALLOW

6. Is user active CaseParticipant?
       ↓ no
      DENY

7. Is participant CASE_ADMIN?
       ↓ yes
      ALLOW

8. Explicit CasePermission?
       ↓
9. Organization RolePermission?
       ↓
10. DENY
```

This will make the whole system much easier to reason about.

---

# 15. Search: immediate fix vs proper fix

### Immediate fix for your hackathon

At minimum:

### A. Add indexing after upload

After creating `DocumentVersion`:

```text
extract file
      ↓
indexEntityInElasticsearch()
```

### B. Add indexing after version upload

Same thing.

### C. Run `/reindex`

After implementing the changes, rebuild the entire index.

---

### Proper fix

Replace your extractor with proper libraries for:

```text
PDF
DOCX
XLSX
PPTX
TXT
CSV
JSON
HTML
XML
RTF
```

and OCR for:

```text
scanned PDF
JPG
PNG
TIFF
```

Then normalize everything into:

```text
content
```

before Elasticsearch.

---

# 16. One more thing: don't put all extracted content blindly into one 80k string

You currently have:

```ts
return extracted.slice(0, 80000)
```

That's okay for a prototype, but for forensic/document search I would eventually index chunks:

```text
Document
 ├── Chunk 1
 ├── Chunk 2
 ├── Chunk 3
 ├── ...
 └── Chunk N
```

For example:

```text
documentId
versionId
chunkId
content
pageNumber
organizationId
caseId
embedding
```

Then:

```text
Search query
    ↓
matching chunk
    ↓
document
    ↓
page/section
```

This gives you much better:

- search relevance
- highlighting
- semantic search
- OCR search
- large-document support
- RAG later

But **I wouldn't make chunking your first hackathon fix**. First get extraction + indexing consistency correct.

---

# Bottom line

Your two red flags are real, and I can point to the causes pretty precisely.

### ABAC

The biggest problems are:

```text
authorization.service.ts
    ↓
requires CaseParticipant before Org Admin

scope.resolver.ts
    ↓
memberships[0]

document.controller.ts
    ↓
duplicate CaseParticipant requirement

evidence.controller.ts
    ↓
duplicate CaseParticipant requirement

audit.controller.ts
    ↓
separate authorization logic

multiple controllers
    ↓
hardcoded superadmin@gov.in
```

### Elasticsearch

The biggest problems are:

```text
document.controller.ts
    ↓
NO ES indexing after upload

document.controller.ts
    ↓
NO ES indexing after new version

extractor.service.ts
    ↓
weak PDF extraction

extractor.service.ts
    ↓
no real DOCX/XLSX/PPTX extraction

search.service.ts
    ↓
DB fallback cannot search file content

server.ts
    ↓
indexing primarily happens at boot
```

**So I would tackle this in exactly this order:**

```text
PHASE 1
Centralize authorization context
        ↓
Fix SuperAdmin
        ↓
Fix multi-org membership
        ↓
Fix Org Admin scope
        ↓
Remove duplicate participant checks
        ↓
Fix all list/detail endpoints


PHASE 2
Build proper document indexer
        ↓
Extract uploaded file
        ↓
OCR where necessary
        ↓
Index on every upload/version
        ↓
Reindex existing data


PHASE 3
Improve ES mappings/query
        ↓
BM25
        +
fuzzy
        +
identifier search
        +
semantic search
        ↓
chunking later
```

If you want to actually modify this codebase next, **I would start with Phase 1 and replace the authorization mess centrally rather than patching individual controllers**. That will also make the Elasticsearch security filters much cleaner because the search scope can consume the exact same authorization context.


---

*Exported with [Speed Booster Toolkit for ChatGPT](https://chromewebstore.google.com/detail/finipiejpmpccemiedioehhpgcafnndo) — export any chat to PDF, MD, TXT & more for **free**.*
