import { PERMISSIONS } from "../src/utils/authorization";

describe("Authorization permission constants", () => {
  test("contains case permissions", () => {
    expect(PERMISSIONS.CASE_READ).toBe("CASE_READ");
    expect(PERMISSIONS.CASE_UPDATE).toBe("CASE_UPDATE");
    expect(PERMISSIONS.CASE_PARTICIPANT_MANAGE).toBe("CASE_PARTICIPANT_MANAGE");
  });

  test("contains document permissions", () => {
    expect(PERMISSIONS.DOCUMENT_READ).toBe("DOCUMENT_READ");
    expect(PERMISSIONS.DOCUMENT_DOWNLOAD).toBe("DOCUMENT_DOWNLOAD");
    expect(PERMISSIONS.DOCUMENT_UPLOAD).toBe("DOCUMENT_UPLOAD");
    expect(PERMISSIONS.DOCUMENT_VERIFY).toBe("DOCUMENT_VERIFY");
  });

  test("contains evidence & custody permissions", () => {
    expect(PERMISSIONS.EVIDENCE_CREATE).toBe("EVIDENCE_CREATE");
    expect(PERMISSIONS.CUSTODY_TRANSFER).toBe("CUSTODY_TRANSFER");
    expect(PERMISSIONS.CUSTODY_ACCEPT).toBe("CUSTODY_ACCEPT");
    expect(PERMISSIONS.CUSTODY_REJECT).toBe("CUSTODY_REJECT");
    expect(PERMISSIONS.CUSTODY_HISTORY_READ).toBe("CUSTODY_HISTORY_READ");
  });

  test("contains audit & permission management constants", () => {
    expect(PERMISSIONS.AUDIT_READ).toBe("AUDIT_READ");
    expect(PERMISSIONS.CASE_PERMISSION_GRANT).toBe("CASE_PERMISSION_GRANT");
    expect(PERMISSIONS.CASE_PERMISSION_REVOKE).toBe("CASE_PERMISSION_REVOKE");
  });
});
