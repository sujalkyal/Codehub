import { PrismaClient } from "@prisma/client";

const PrismaClientSingleton = () => {
    return new PrismaClient();
};

globalThis.prismaGlobal = globalThis.prismaGlobal || PrismaClientSingleton();

const prisma = globalThis.prismaGlobal;

export default prisma;