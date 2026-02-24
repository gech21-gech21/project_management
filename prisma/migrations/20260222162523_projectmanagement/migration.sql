/*
  Warnings:

  - The `role` column on the `team_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('LEADER', 'MEMBER', 'GUEST');

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "role",
ADD COLUMN     "role" "role" NOT NULL DEFAULT 'MEMBER';

-- DropEnum
DROP TYPE "TeamRole";
