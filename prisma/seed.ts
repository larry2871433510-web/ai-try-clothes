import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const aiModels = [
  {
    id: "female-standard-minimal",
    name: "女模特 A",
    gender: "女模特",
    bodyType: "标准身材",
    style: "极简棚拍",
    imageUrl: "/mock/models/female-standard-minimal.svg",
    isActive: true
  },
  {
    id: "female-tall-street",
    name: "女模特 B",
    gender: "女模特",
    bodyType: "高挑身材",
    style: "街拍风",
    imageUrl: "/mock/models/female-tall-street.svg",
    isActive: true
  },
  {
    id: "female-curvy-commute",
    name: "女模特 C",
    gender: "女模特",
    bodyType: "微胖身材",
    style: "通勤风",
    imageUrl: "/mock/models/female-curvy-commute.svg",
    isActive: true
  },
  {
    id: "male-standard-minimal",
    name: "男模特 A",
    gender: "男模特",
    bodyType: "标准身材",
    style: "极简棚拍",
    imageUrl: "/mock/models/male-standard-minimal.svg",
    isActive: true
  },
  {
    id: "male-tall-street",
    name: "男模特 B",
    gender: "男模特",
    bodyType: "高挑身材",
    style: "街拍风",
    imageUrl: "/mock/models/male-tall-street.svg",
    isActive: true
  },
  {
    id: "male-athletic-sport",
    name: "男模特 C",
    gender: "男模特",
    bodyType: "运动身材",
    style: "运动风",
    imageUrl: "/mock/models/male-athletic-sport.svg",
    isActive: true
  }
];

async function main() {
  await prisma.aiModel.updateMany({
    where: {
      id: {
        notIn: aiModels.map((model) => model.id)
      }
    },
    data: {
      isActive: false
    }
  });

  for (const model of aiModels) {
    await prisma.aiModel.upsert({
      where: { id: model.id },
      update: model,
      create: model
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
