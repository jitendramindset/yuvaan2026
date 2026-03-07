import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { encryptBlob, decryptBlob } from "./blob_cipher.js";

export async function writeBlob(
  data: Buffer,
  keyHex: string,
  blobDir = "storage/blobs",
): Promise<string> {
  const address = createHash("sha3-256").update(data).digest("hex");
  const encrypted = encryptBlob(data, keyHex);
  await fs.mkdir(blobDir, { recursive: true });
  await fs.writeFile(path.join(blobDir, address), encrypted);
  return address;
}

export async function readBlob(
  address: string,
  keyHex: string,
  blobDir = "storage/blobs",
): Promise<Buffer> {
  const encrypted = await fs.readFile(path.join(blobDir, address));
  return decryptBlob(encrypted, keyHex);
}
