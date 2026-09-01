import { writable, derived } from 'svelte/store';
import {
  saveUploadedFile,
  loadUploadedFiles,
  deleteUploadedFile,
  saveUploadedCostFile,
  loadUploadedCostFiles,
  deleteUploadedCostFile,
  type UploadedFileEntry,
  type UploadedCostFileEntry,
} from './cache';
import type { CostRecord, UsageRecord } from './types';

export const uploadedFiles = writable<UploadedFileEntry[]>([]);

export const uploadedRecords = derived(uploadedFiles, (files) => files.flatMap((f) => f.records));

export async function refreshUploadedFiles(): Promise<void> {
  uploadedFiles.set(await loadUploadedFiles());
}

export async function addUploadedFile(name: string, records: UsageRecord[]): Promise<void> {
  const id = `${name}-${Date.now()}`;
  await saveUploadedFile({ id, name, addedAt: new Date().toISOString(), records });
  await refreshUploadedFiles();
}

export async function removeUploadedFile(id: string): Promise<void> {
  await deleteUploadedFile(id);
  await refreshUploadedFiles();
}

export const uploadedCostFiles = writable<UploadedCostFileEntry[]>([]);

export const uploadedCostRecords = derived(uploadedCostFiles, (files) => files.flatMap((f) => f.records));

export async function refreshUploadedCostFiles(): Promise<void> {
  uploadedCostFiles.set(await loadUploadedCostFiles());
}

export async function addUploadedCostFile(name: string, records: CostRecord[]): Promise<void> {
  const id = `${name}-${Date.now()}`;
  await saveUploadedCostFile({ id, name, addedAt: new Date().toISOString(), records });
  await refreshUploadedCostFiles();
}

export async function removeUploadedCostFile(id: string): Promise<void> {
  await deleteUploadedCostFile(id);
  await refreshUploadedCostFiles();
}

if (typeof indexedDB !== 'undefined') {
  refreshUploadedFiles();
  refreshUploadedCostFiles();
}
