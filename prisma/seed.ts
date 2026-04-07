import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const hashedPassword = await bcrypt.hash("admin123", 12)

  console.log("Generated hash:", hashedPassword)

  const admin = await prisma.user.upsert({
    where: { email: "houngbedjimaxfructueux@gmail.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "houngbedjimaxfructueux@gmail.com",
      password: hashedPassword,
      name: "Max-Fructueux HOUNGBEDJI",
      role: "admin",
      bio: "UX/UI Designer & Frontend Developer",
    },
  })

  console.log("Admin created/updated:", admin.email)

  const projects = [
    {
      title: "Application Mobile de Reservation",
      slug: "app-reservation",
      description: "Refonte complete de l experience utilisateur d une application de reservation",
      category: "ux-ui",
      tags: ["Mobile", "UX Research", "Figma"],
      technologies: ["Figma", "Prototyping", "User Testing"],
      status: "published",
      featured: true,
      order: 1,
    },
    {
      title: "Plateforme E-commerce",
      slug: "ecommerce-platform",
      description: "Developpement d une boutique en ligne moderne et performante",
      category: "frontend",
      tags: ["Web", "E-commerce", "React"],
      technologies: ["Next.js", "Tailwind CSS", "Stripe"],
      status: "published",
      featured: true,
      order: 2,
    },
    {
      title: "Design System",
      slug: "design-system",
      description: "Creation d un systeme de design coherent et scalable",
      category: "ux-ui",
      tags: ["Design System", "Components", "Documentation"],
      technologies: ["Figma", "Storybook", "React"],
      status: "published",
      featured: false,
      order: 3,
    },
    {
      title: "Dashboard Analytics",
      slug: "dashboard-analytics",
      description: "Interface de visualisation de donnees complexes",
      category: "frontend",
      tags: ["Dashboard", "Data Viz", "Charts"],
      technologies: ["React", "D3.js", "Tailwind"],
      status: "published",
      featured: false,
      order: 4,
    },
  ]

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: {
        ...project,
        userId: admin.id,
        publishedAt: new Date(),
      },
    })
  }

  console.log("Projects created:", projects.length)

  const clientsData = [
    {
      name: "Agence Digitale XYZ",
      email: "contact@agence-xyz.com",
      company: "Agence XYZ",
      status: "active",
      phone: "+229 97 00 00 00",
    },
    {
      name: "Jean Dupont",
      email: "jean.dupont@email.com",
      company: "Startup ABC",
      status: "lead",
    },
    {
      name: "Marie Martin",
      email: "marie.martin@entreprise.com",
      company: "Entreprise Martin",
      status: "active",
    },
  ]

  for (const clientData of clientsData) {
    await prisma.client.upsert({
      where: { email: clientData.email },
      update: {},
      create: {
        ...clientData,
        userId: admin.id,
      },
    })
  }

  console.log("Clients created:", clientsData.length)

  // Seed time entries for dashboard stats
  const now = new Date()

  // Delete old time entries to avoid duplicates
  await prisma.timeEntry.deleteMany({
    where: { userId: admin.id },
  })

  // Create realistic time entries for this month
  const timeEntries = [
    // This week
    { date: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000), type: "design", hours: 6 }, // Today
    { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 }, // Yesterday
    { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), type: "dev", hours: 7 }, // 2 days ago
    { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), type: "meeting", hours: 2 },
    { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), type: "design", hours: 5 },
    { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), type: "support", hours: 1 },
    { date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 },
    { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), type: "admin", hours: 1 },
    { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), type: "design", hours: 6 },
    { date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 },

    // Previous week (sprint)
    { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), type: "design", hours: 6 },
    { date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 },
    { date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), type: "meeting", hours: 3 },
    { date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), type: "dev", hours: 7 },
    { date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), type: "admin", hours: 2 },
    { date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000), type: "design", hours: 5 },
    { date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), type: "support", hours: 4 },
    { date: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 },

    // Earlier in month
    { date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), type: "meeting", hours: 2 },
    { date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), type: "design", hours: 7 },
    { date: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 },
    { date: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000), type: "admin", hours: 3 },
    { date: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), type: "support", hours: 3 },
    { date: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000), type: "design", hours: 6 },
    { date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), type: "dev", hours: 8 },
    { date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), type: "meeting", hours: 4 },
  ]

  for (const entry of timeEntries) {
    await prisma.timeEntry.create({
      data: {
        userId: admin.id,
        activityType: entry.type,
        hours: entry.hours,
        date: entry.date,
        description: `${entry.type} work`,
      },
    })
  }

  console.log("Time entries created:", timeEntries.length)
  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
