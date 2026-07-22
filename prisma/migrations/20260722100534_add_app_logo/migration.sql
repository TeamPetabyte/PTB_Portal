-- AlterTable
ALTER TABLE "tbl_AccessGroup" RENAME CONSTRAINT "AccessGroup_pkey" TO "tbl_AccessGroup_pkey";

-- AlterTable
ALTER TABLE "tbl_App" RENAME CONSTRAINT "App_pkey" TO "tbl_App_pkey";

-- AlterTable
ALTER TABLE "tbl_App" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "tbl_AppAccess" RENAME CONSTRAINT "AppAccess_pkey" TO "tbl_AppAccess_pkey";

-- RenameForeignKey
ALTER TABLE "tbl_AppAccess" RENAME CONSTRAINT "AppAccess_appId_fkey" TO "tbl_AppAccess_appId_fkey";

-- RenameForeignKey
ALTER TABLE "tbl_AppAccess" RENAME CONSTRAINT "AppAccess_groupId_fkey" TO "tbl_AppAccess_groupId_fkey";

-- RenameIndex
ALTER INDEX "AccessGroup_entraGroupId_key" RENAME TO "tbl_AccessGroup_entraGroupId_key";
