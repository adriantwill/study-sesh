"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteItemAction(id: string, variant: "upload" | "question") {
  const supabase = await createClient();

  try {
    if (variant === "question") {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      // We can't know the exact review ID here easily without passing it, 
      // but revalidating the layout or homepage is safe.
      // Revalidating "/" might be too aggressive if we are deep in a review page.
      // Ideally, pass the reviewId to this action if needed for precise revalidation.
      // For now, revalidatePath("/", "layout") covers most bases or we rely on router.refresh() client-side if needed.
      // Actually, since this is a server action, revalidatePath is the way.
      // We'll revalidate the general paths.
      revalidatePath("/review/[reviewId]", "page"); 
    } else {
      const { error } = await supabase.from("uploads").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/"); 
    }
  } catch (error) {
    console.error("Delete error:", error);
    throw new Error(`Failed to delete ${variant}`);
  }
}
