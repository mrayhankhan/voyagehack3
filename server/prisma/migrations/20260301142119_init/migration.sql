-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOfferId" TEXT,
    "lockedUnits" INTEGER NOT NULL,
    "allocatedUnits" INTEGER NOT NULL DEFAULT 0,
    "availableUnits" INTEGER NOT NULL,
    "costPerUnit" REAL NOT NULL,
    "sellPerUnit" REAL NOT NULL,
    "releaseDate" DATETIME,
    "holdExpiresAt" DATETIME,
    "status" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "InventoryBlock_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT,
    "type" TEXT NOT NULL,
    "inventoryBlockId" TEXT,
    "providerBookingId" TEXT,
    "affiliateReference" TEXT,
    "status" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "sellPrice" REAL NOT NULL,
    "margin" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "idempotencyKey" TEXT,
    CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_inventoryBlockId_fkey" FOREIGN KEY ("inventoryBlockId") REFERENCES "InventoryBlock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "rsvp" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "InventoryBlock_eventId_idx" ON "InventoryBlock"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_eventId_idx" ON "Booking"("eventId");

-- CreateIndex
CREATE INDEX "Booking_inventoryBlockId_idx" ON "Booking"("inventoryBlockId");

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");
