import { apiRequest } from "./client";

export const masterDataApi = {
  listMenus() {
    return apiRequest("/menus", { auth: false });
  },
  getMenu(menuId: number) {
    return apiRequest(`/menus/${menuId}`, { auth: false });
  },
  listMenuCategories() {
    return apiRequest("/menu-categories", { auth: false });
  },
  listTags() {
    return apiRequest("/tags", { auth: false });
  },
  listAllergies() {
    return apiRequest("/allergies", { auth: false });
  },
  listMeetingPurposes() {
    return apiRequest("/meeting-purposes", { auth: false });
  }
};
