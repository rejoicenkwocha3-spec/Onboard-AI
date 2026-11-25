"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { DOC_CATEGORIES } from "@/lib/constants";
import { audit, back, dbError, needWrite, s } from "@/lib/forms";

const P = "/dashboard/documents";
const MAX = 4 * 1024 * 1024;
const ALLOWED = new Set(["pdf", "doc", "docx", "txt", "rtf", "csv", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg"]);

export async function uploadDocument(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) back(P, { error: "Choose a file to upload." });
  const f = file as File;
  if (f.size > MAX) back(P, { error: "Files can be up to 4 MB." });
  const ext = (f.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED.has(ext)) back(P, { error: "That file type is not supported. Use PDF, DOCX, TXT, spreadsheets, slides or images." });
  const category = DOC_CATEGORIES.some(([k]) => k === s(fd, "category")) ? s(fd, "category") : "other";
  const safe = f.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
  const path = `${ctx.orgId}/${randomUUID()}-${safe}`;
  const up = await ctx.supabase.storage.from("oa-documents").upload(path, f, { contentType: f.type || undefined, upsert: false });
  if (up.error) dbError(P, "upload the file", { message: up.error.message });
  const { data, error } = await ctx.supabase.from("oa_documents").insert({
    organization_id: ctx.orgId, name: s(fd, "name") || f.name, category, storage_path: path,
    mime_type: f.type || null, size_bytes: f.size, uploaded_by: ctx.user.id,
  }).select("id").single();
  if (error) {
    await ctx.supabase.storage.from("oa-documents").remove([path]);
    dbError(P, "save the document", error);
  }
  await audit(ctx, "document.uploaded", "document", data.id, f.name);
  revalidatePath(P);
  back(P, { notice: "Document uploaded." });
}

export async function deleteDocument(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id");
  const { data: doc } = await ctx.supabase.from("oa_documents").select("storage_path, name").eq("id", id).maybeSingle();
  if (!doc) back(P, { error: "Document not found." });
  const { error } = await ctx.supabase.from("oa_documents").delete().eq("id", id);
  if (error) dbError(P, "delete the document", error);
  await ctx.supabase.storage.from("oa-documents").remove([doc!.storage_path]);
  await audit(ctx, "document.deleted", "document", id, doc!.name);
  revalidatePath(P);
  back(P, { notice: "Document deleted." });
}
