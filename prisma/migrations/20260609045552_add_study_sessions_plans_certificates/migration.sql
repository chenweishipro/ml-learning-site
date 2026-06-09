-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "chapterSlug" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "studyDate" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "targetDate" DATETIME,
    "dailyTarget" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalScore" REAL NOT NULL DEFAULT 100,
    "serialNo" TEXT NOT NULL,
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StudySession_userId_studyDate_idx" ON "StudySession"("userId", "studyDate");

-- CreateIndex
CREATE INDEX "StudySession_userId_courseSlug_chapterSlug_idx" ON "StudySession"("userId", "courseSlug", "chapterSlug");

-- CreateIndex
CREATE INDEX "StudyPlan_userId_active_idx" ON "StudyPlan"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_serialNo_key" ON "Certificate"("serialNo");

-- CreateIndex
CREATE INDEX "Certificate_serialNo_idx" ON "Certificate"("serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_courseSlug_key" ON "Certificate"("userId", "courseSlug");
