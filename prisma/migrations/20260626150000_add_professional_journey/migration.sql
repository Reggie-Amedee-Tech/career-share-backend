-- CreateTable
CREATE TABLE "ProfessionalJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetJobTitle" TEXT NOT NULL,
    "targetJobLocation" TEXT NOT NULL,
    "chartConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalJourney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalJourney_userId_idx" ON "ProfessionalJourney"("userId");

-- AddForeignKey
ALTER TABLE "ProfessionalJourney" ADD CONSTRAINT "ProfessionalJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy user job preferences when those columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'User'
          AND column_name = 'targetJobTitle'
    ) THEN
        INSERT INTO "ProfessionalJourney" (
            "id",
            "userId",
            "name",
            "targetJobTitle",
            "targetJobLocation",
            "chartConfig",
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid()::text,
            "id",
            COALESCE(NULLIF("targetJobTitle", ''), 'My journey'),
            "targetJobTitle",
            "targetJobLocation",
            '{}'::jsonb,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM "User"
        WHERE "targetJobTitle" IS NOT NULL
          AND "targetJobTitle" <> ''
          AND "targetJobLocation" IS NOT NULL
          AND "targetJobLocation" <> '';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "targetJobTitle",
DROP COLUMN IF EXISTS "targetJobLocation";
