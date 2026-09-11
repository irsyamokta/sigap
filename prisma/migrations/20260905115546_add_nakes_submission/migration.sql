-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DINKES', 'PUSKESMAS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PUSKESMAS',
    "puskesmasCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NakesSubmission" (
    "id" TEXT NOT NULL,
    "puskesmasCode" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NakesSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NakesSubmissionItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "jenisNakes" TEXT NOT NULL,
    "kebutuhan" INTEGER NOT NULL,
    "tersedia" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NakesSubmissionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "NakesSubmission_puskesmasCode_submittedAt_idx" ON "NakesSubmission"("puskesmasCode", "submittedAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NakesSubmission" ADD CONSTRAINT "NakesSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NakesSubmissionItem" ADD CONSTRAINT "NakesSubmissionItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "NakesSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
