-- CreateTable
CREATE TABLE "GeocodeCache" (
    "locationKey" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "countryShortName" TEXT NOT NULL DEFAULT 'US',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeocodeCache_pkey" PRIMARY KEY ("locationKey")
);
