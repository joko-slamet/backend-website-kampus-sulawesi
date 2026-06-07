-- CreateTable
CREATE TABLE "WhatsappClickLog" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL DEFAULT '/',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappClickLog_pkey" PRIMARY KEY ("id")
);
