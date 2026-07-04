import { apiRequest } from "./client";

export const masterDataApi = {
  listMenus() {
    return apiRequest("/menus");
  },
  getMenu(menuId: number) {
    return apiRequest(`/menus/${menuId}`);
  },
  listMenuCategories() {
    return apiRequest("/menu-categories");
  },
  listTags() {
    return apiRequest("/tags");
  },
  listAllergies() {
    return apiRequest("/allergies");
  },
  listMeetingPurposes() {
    return apiRequest("/meeting-purposes");
  }
};
