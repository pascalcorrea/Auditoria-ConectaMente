// Global Prisma type declarations
declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any);
  }
  export namespace Prisma {
    [key: string]: any;
  }
  export const prisma: PrismaClient;
}
