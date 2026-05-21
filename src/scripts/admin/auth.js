import { onAuthStateChanged, signOut } from "firebase/auth";
import { getAdminAuth } from "./firebase.js";

export const ADMIN_EMAILS = [
  "getcognifocus@gmail.com",
  "cognielevate@gmail.com",
];

export function isAuthorizedAdmin(user) {
  return ADMIN_EMAILS.includes(user?.email || "");
}

export function waitForAdminUser(auth) {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function requireAdminUser() {
  const auth = await getAdminAuth();
  const user = await waitForAdminUser(auth);

  if (!user) {
    window.location.assign("/admin/login");
    return null;
  }

  if (!isAuthorizedAdmin(user)) {
    await clearAdminSession();
    window.location.assign("/admin/login?denied=1");
    return null;
  }

  return user;
}

export async function getAdminIdToken() {
  const user = await requireAdminUser();

  if (!user) {
    return "";
  }

  return user.getIdToken();
}

export async function clearAdminSession() {
  const auth = await getAdminAuth();

  if (auth.currentUser) {
    await signOut(auth);
  }
}

export async function logoutAdmin() {
  await clearAdminSession();
  window.location.assign("/admin/login");
}
