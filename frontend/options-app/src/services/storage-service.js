import { clone } from "@/utils/clone";
import { getStorage } from "@/services/globals";

export async function loadSettings() {
  const storage = getStorage();
  if (typeof storage.getSettings !== "function") {
    throw new Error("当前扩展版本不支持读取设置。");
  }
  return clone(await storage.getSettings());
}

export async function saveSettings(settings) {
  const storage = getStorage();
  if (typeof storage.saveSettings !== "function") {
    throw new Error("当前扩展版本不支持保存设置。");
  }
  return clone(await storage.saveSettings(clone(settings)));
}

export async function patchSettings(patch) {
  const storage = getStorage();
  if (typeof storage.patchSettings !== "function") {
    throw new Error("当前扩展版本不支持局部保存设置。");
  }
  return clone(await storage.patchSettings(clone(patch)));
}

export async function setScriptEnabled(scriptId, enabled) {
  const storage = getStorage();
  if (typeof storage.setScriptEnabled !== "function") {
    throw new Error("当前扩展版本不支持切换脚本状态。");
  }
  return clone(await storage.setScriptEnabled(scriptId, enabled));
}

export async function saveProjectSettings(projectId, patch) {
  const storage = getStorage();
  if (typeof storage.saveProjectSettings !== "function") {
    throw new Error("当前扩展版本不支持保存项目设置。");
  }
  return clone(await storage.saveProjectSettings(projectId, clone(patch)));
}
