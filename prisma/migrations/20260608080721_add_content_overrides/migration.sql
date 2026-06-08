-- CreateTable
CREATE TABLE "CourseOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseSlug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "level" TEXT,
    "duration" TEXT,
    "tags" TEXT,
    "body" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChapterOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseSlug" TEXT NOT NULL,
    "chapterSlug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContentEditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "chapterSlug" TEXT,
    "userId" TEXT NOT NULL,
    "courseRefId" TEXT,
    "chapterRefId" TEXT,
    "action" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentEditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentEditLog_courseRefId_fkey" FOREIGN KEY ("courseRefId") REFERENCES "CourseOverride" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentEditLog_chapterRefId_fkey" FOREIGN KEY ("chapterRefId") REFERENCES "ChapterOverride" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseOverride_courseSlug_key" ON "CourseOverride"("courseSlug");

-- CreateIndex
CREATE INDEX "ChapterOverride_courseSlug_idx" ON "ChapterOverride"("courseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterOverride_courseSlug_chapterSlug_key" ON "ChapterOverride"("courseSlug", "chapterSlug");

-- CreateIndex
CREATE INDEX "ContentEditLog_scope_courseSlug_chapterSlug_idx" ON "ContentEditLog"("scope", "courseSlug", "chapterSlug");

-- CreateIndex
CREATE INDEX "ContentEditLog_userId_idx" ON "ContentEditLog"("userId");

-- CreateIndex
CREATE INDEX "ContentEditLog_createdAt_idx" ON "ContentEditLog"("createdAt");
