-- CreateTable
CREATE TABLE "tbl_Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_AppOpenEvent" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_AppOpenEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_AppOpenEvent_appId_openedAt_idx" ON "tbl_AppOpenEvent"("appId", "openedAt");

-- AddForeignKey
ALTER TABLE "tbl_AppOpenEvent" ADD CONSTRAINT "tbl_AppOpenEvent_appId_fkey" FOREIGN KEY ("appId") REFERENCES "tbl_App"("id") ON DELETE CASCADE ON UPDATE CASCADE;
