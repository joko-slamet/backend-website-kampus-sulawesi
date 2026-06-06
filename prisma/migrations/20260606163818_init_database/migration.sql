-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryColor" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "readTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "tag" TEXT,
    "tagColor" TEXT,
    "titleEn" TEXT NOT NULL,
    "excerptEn" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "badgeColor" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "accreditation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "color" TEXT NOT NULL,
    "bgGradient" TEXT NOT NULL,
    "alumni" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
