import { masterDataRepository } from "./masterData.repository.js";

export const masterDataService = {
  listMenus() {
    return masterDataRepository.findMenus();
  },

  getMenu(menuId: number) {
    return masterDataRepository.findMenuById(menuId);
  }
};
