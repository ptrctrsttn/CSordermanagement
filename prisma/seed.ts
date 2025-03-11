const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const drivers = [
  { name: 'Gero' },
  { name: 'Luciano' },
  { name: 'Peter' },
  { name: 'Nacho' },
  { name: 'Christine' },
  { name: 'Uber' }
]

async function main() {
  console.log('Starting to seed drivers...')
  
  for (const driver of drivers) {
    const existingDriver = await prisma.driver.findFirst({
      where: { name: driver.name }
    })
    
    if (!existingDriver) {
      await prisma.driver.create({
        data: driver
      })
      console.log(`Created driver: ${driver.name}`)
    } else {
      console.log(`Driver ${driver.name} already exists, skipping...`)
    }
  }
  
  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 