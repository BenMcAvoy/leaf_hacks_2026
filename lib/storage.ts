import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "./firebase";

/** Upload a file under a user's uploads folder and return its public download URL. */
export async function uploadUserFile(
  uid: string,
  file: File,
): Promise<{ url: string; contentType: string }> {
  const storage = getStorage(firebaseApp);
  const path = `uploads/${uid}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, contentType: file.type || "application/octet-stream" };
}
