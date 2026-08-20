import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import bcrypt from "bcryptjs";

const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("rahasia123", 10);

  // 1. Dinkes Account
  const dinkes = await prisma.user.upsert({
    where: { email: "dinkes@banyumaskab.go.id" },
    update: {},
    create: {
      email: "dinkes@banyumaskab.go.id",
      passwordHash: passwordHash,
      role: "DINKES",
    },
  });

  // 2. Puskesmas Purwokerto Barat
  const pwtBarat = await prisma.user.upsert({
    where: { email: "purwokertobarat@banyumaskab.go.id" },
    update: {},
    create: {
      email: "purwokertobarat@banyumaskab.go.id",
      passwordHash: passwordHash,
      role: "PUSKESMAS",
      puskesmasCode: "purwokerto_barat",
    },
  });

  // 3. Puskesmas Patikraja
  const patikraja = await prisma.user.upsert({
    where: { email: "patikraja@banyumaskab.go.id" },
    update: {},
    create: {
      email: "patikraja@banyumaskab.go.id",
      passwordHash: passwordHash,
      role: "PUSKESMAS",
      puskesmasCode: "patikraja",
    },
  });

  // 4. Puskesmas Sokaraja 1
  const sokaraja1 = await prisma.user.upsert({
    where: { email: "sokaraja1@banyumaskab.go.id" },
    update: {},
    create: {
      email: "sokaraja1@banyumaskab.go.id",
      passwordHash: passwordHash,
      role: "PUSKESMAS",
      puskesmasCode: "sokaraja_1",
    },
  });

  // 5. Puskesmas Kembaran 1
  const kembaran1 = await prisma.user.upsert({
    where: { email: "kembaran1@banyumaskab.go.id" },
    update: {},
    create: {
      email: "kembaran1@banyumaskab.go.id",
      passwordHash: passwordHash,
      role: "PUSKESMAS",
      puskesmasCode: "kembaran_1",
    },
  });

  console.log("Seeding finished.");
  console.log({ dinkes, pwtBarat, patikraja, sokaraja1, kembaran1 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
