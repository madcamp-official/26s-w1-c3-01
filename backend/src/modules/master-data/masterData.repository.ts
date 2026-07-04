import { prisma } from "../../config/db.js";

export const masterDataRepository = {
  findMenus() {
    return prisma.$queryRaw`select * from menus order by menu_id`;
  },

  findMenuById(menuId: number) {
    return prisma.$queryRaw`select * from menus where menu_id = ${menuId} limit 1`;
  }
};
