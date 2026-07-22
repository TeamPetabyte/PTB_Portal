-- RenameTable
-- Hand-authored (not `prisma migrate dev`) so existing rows are preserved via
-- RENAME instead of Prisma's default DROP + CREATE diff for @@map changes.
ALTER TABLE "App" RENAME TO "tbl_App";
ALTER TABLE "AccessGroup" RENAME TO "tbl_AccessGroup";
ALTER TABLE "AppAccess" RENAME TO "tbl_AppAccess";
