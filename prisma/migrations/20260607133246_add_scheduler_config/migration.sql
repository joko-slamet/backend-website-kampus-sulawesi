-- CreateTable
CREATE TABLE "SchedulerConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "times" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulerConfig_pkey" PRIMARY KEY ("id")
);
