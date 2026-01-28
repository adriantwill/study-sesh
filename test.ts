import { Poppler } from "node-poppler";
import path from "path";
import fs from "fs/promises";

async function testPopplerNaming() {
  const tempDir = path.join(process.cwd(), "temp");
  await fs.mkdir(tempDir, { recursive: true });

  const fileId = Math.random().toString(36).substring(7);
  const outputPrefix = path.join(tempDir, `slides-${fileId}`);

  // Use a test PDF - update this path to your test file
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: npx tsx test.ts <path-to-pdf>");
    process.exit(1);
  }

  console.log("fileId:", fileId);
  console.log("outputPrefix:", outputPrefix);

  const poppler = new Poppler();
  await poppler.pdfToCairo(pdfPath, outputPrefix, {
    firstPageToConvert: 1,
    lastPageToConvert: 15, // limit pages
    pngFile: true,
    scalePageTo: 1024,
  });

  const allFiles = await fs.readdir(tempDir);
  const imageFiles = allFiles.filter(
    (f) => f.startsWith(`slides-${fileId}`) && f.endsWith(".png")
  );

  console.log("\nUnsorted files from readdir:");
  console.log(imageFiles);

  console.log("\nWith .sort():");
  console.log([...imageFiles].sort());

  // Cleanup
  for (const f of imageFiles) {
    await fs.unlink(path.join(tempDir, f));
  }
}

testPopplerNaming().catch(console.error);
