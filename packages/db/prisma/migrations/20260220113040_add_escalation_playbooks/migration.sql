-- CreateTable
CREATE TABLE "EscalationPlaybook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "impactLevel" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "communicationTemplate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EscalationPlaybookStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playbookId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EscalationPlaybookStep_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "EscalationPlaybook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
