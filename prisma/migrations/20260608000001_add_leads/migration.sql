CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "program" TEXT,
  "school" TEXT,
  "message" TEXT,
  "source" TEXT NOT NULL DEFAULT 'website',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
