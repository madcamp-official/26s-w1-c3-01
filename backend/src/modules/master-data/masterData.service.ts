import { masterDataRepository } from "./masterData.repository.js";

export const masterDataService = {
  listMenus() {
    return masterDataRepository.findMenus();
  },

  getMenu(menuId: number) {
    return masterDataRepository.findMenuById(menuId);
  },

  listMenuCategories() {
    return masterDataRepository.listTable("menu_categories");
  },

  listTags() {
    return masterDataRepository.listTable("tags");
  },

  listAllergies() {
    return masterDataRepository.listTable("allergies");
  },

  listMeetingPurposes() {
    return masterDataRepository.listTable("meeting_purposes");
  }
};
