<script lang="ts">
  import { parseNdjson } from '../data/parse';
  import { parseCostCsv } from '../data/csv';
  import { fetchLatestExport } from '../data/fetchRemote';
  import { getUsageDirectoryHandle, writeFileToDirectory, isFileSystemAccessSupported } from '../data/folderAccess';
  import { downloadTextFile } from '../utils/download';
  import {
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    uploadedCostFiles,
    addUploadedCostFile,
    removeUploadedCostFile,
  } from '../data/uploadStore';

  interface Props {
    latestDay: string;
  }

  let { latestDay }: Props = $props();

  const URL_STORAGE_KEY = 'copilot-report-fetch-url';

  type Mode = 'menu' | 'url';

  let open = $state(false);
  let mode = $state<Mode>('menu');
  let url = $state(typeof localStorage !== 'undefined' ? (localStorage.getItem(URL_STORAGE_KEY) ?? '') : '');
  let busy = $state(false);
  let error = $state('');
  let info = $state('');

  const supportsFilePicker = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

  let combinedFiles = $derived(
    [
      ...$uploadedFiles.map((f) => ({ id: f.id, name: f.name, kind: 'usage' as const })),
      ...$uploadedCostFiles.map((f) => ({ id: f.id, name: f.name, kind: 'cost' as const })),
    ].sort((a, b) => a.name.localeCompare(b.name)),
  );

  function removeFile(id: string, kind: 'usage' | 'cost') {
    if (kind === 'usage') removeUploadedFile(id);
    else removeUploadedCostFile(id);
  }

  function resetMessages() {
    error = '';
    info = '';
  }

  function closeMenu() {
    open = false;
    mode = 'menu';
  }

  async function ingestNdjsonFiles(files: File[]) {
    busy = true;
    resetMessages();
    try {
      for (const file of files) {
        await addUploadedFile(file.name, parseNdjson(await file.text()));
      }
    } catch {
      error = 'Could not read one or more files. Ensure they are valid NDJSON.';
    } finally {
      busy = false;
    }
  }

  async function ingestCsvFiles(files: File[]) {
    busy = true;
    resetMessages();
    try {
      for (const file of files) {
        await addUploadedCostFile(file.name, parseCostCsv(await file.text()));
      }
    } catch {
      error = 'Could not read one or more files. Ensure they are valid CSV.';
    } finally {
      busy = false;
    }
  }

  async function pickNdjsonFiles() {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        startIn: 'downloads',
        id: 'copilot-report-ndjson',
        types: [{ description: 'NDJSON', accept: { 'application/x-ndjson': ['.ndjson', '.jsonl', '.json'] } }],
      });
      await ingestNdjsonFiles(await Promise.all(handles.map((h) => h.getFile())));
      closeMenu();
    } catch (e) {
      // AbortError just means the user closed the picker without choosing a file.
      if (e instanceof DOMException && e.name === 'AbortError') return;
      error = 'Could not read one or more files. Ensure they are valid NDJSON.';
    }
  }

  async function pickCsvFiles() {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        startIn: 'downloads',
        id: 'copilot-report-csv',
        types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }],
      });
      await ingestCsvFiles(await Promise.all(handles.map((h) => h.getFile())));
      closeMenu();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      error = 'Could not read one or more files. Ensure they are valid CSV.';
    }
  }

  async function handleNdjsonInputChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    await ingestNdjsonFiles(Array.from(fileList));
    closeMenu();
  }

  async function handleCsvInputChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    await ingestCsvFiles(Array.from(fileList));
    closeMenu();
  }

  function toNdjson(records: unknown[]): string {
    return records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  }

  async function runFetchFromUrl() {
    const trimmed = url.trim();
    if (!trimmed) {
      error = 'Paste the report download link first.';
      return;
    }
    busy = true;
    resetMessages();
    try {
      localStorage.setItem(URL_STORAGE_KEY, trimmed);
      const result = await fetchLatestExport(trimmed, latestDay);
      if (result.newRecords.length === 0) {
        info = `No new data after ${latestDay} — the report is already up to date.`;
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const filename = `pulled-${latestDay}-to-${today}.ndjson`;
      const contents = toNdjson(result.newRecords);

      let savedToUsageFolder = false;
      if (isFileSystemAccessSupported()) {
        try {
          const dir = await getUsageDirectoryHandle();
          await writeFileToDirectory(dir, filename, contents);
          savedToUsageFolder = true;
        } catch {
          savedToUsageFolder = false;
        }
      }

      if (!savedToUsageFolder) {
        downloadTextFile(filename, contents, 'application/x-ndjson');
      }

      await addUploadedFile(filename, result.newRecords);

      info = savedToUsageFolder
        ? `Saved ${result.newRecords.length} new record(s) (through ${result.latestDayAfter}) to data/usage/${filename} and added them to this report.`
        : `Your browser can't write to data/usage/ directly, so ${filename} was downloaded — move it into data/usage/ to keep it. It has already been added to this report.`;
      closeMenu();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not fetch the latest data.';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:window
  onclick={(e) => {
    if (!open) return;
    const insideMenu = e.composedPath().some((el) => el instanceof HTMLElement && el.classList.contains('import-menu'));
    if (!insideMenu) closeMenu();
  }}
/>

<div class="import-menu">
  <button type="button" class="import-btn" onclick={() => (open ? closeMenu() : (open = true))}>⬇ Import data ▾</button>
  {#if open}
    <div class="import-popover">
      {#if mode === 'menu'}
        {#if supportsFilePicker}
          <button type="button" onclick={pickNdjsonFiles}>📄 Upload NDJSON</button>
        {:else}
          <label class="menu-item">
            📄 Upload NDJSON
            <input
              type="file"
              accept=".ndjson,.json,.jsonl"
              multiple
              hidden
              onchange={(e) => handleNdjsonInputChange((e.currentTarget as HTMLInputElement).files)}
            />
          </label>
        {/if}
        <button type="button" onclick={() => { resetMessages(); mode = 'url'; }}>🔗 Pull NDJSON from URL</button>
        {#if supportsFilePicker}
          <button type="button" onclick={pickCsvFiles}>📊 Upload CSV</button>
        {:else}
          <label class="menu-item">
            📊 Upload CSV
            <input
              type="file"
              accept=".csv"
              multiple
              hidden
              onchange={(e) => handleCsvInputChange((e.currentTarget as HTMLInputElement).files)}
            />
          </label>
        {/if}
        {#if combinedFiles.length > 0}
          <div class="divider"></div>
          <p class="section-label">Imported files</p>
          <ul class="uploaded-list">
            {#each combinedFiles as f (f.id)}
              <li>
                <span>{f.name}</span>
                <button type="button" onclick={() => removeFile(f.id, f.kind)} aria-label={`Remove ${f.name}`}>✕</button>
              </li>
            {/each}
          </ul>
        {/if}
      {:else}
        <label class="url-label">
          Report download link
          <input type="url" placeholder="https://copilot-reports.github.com/..." bind:value={url} />
        </label>
        <p class="hint">Pulls rows after {latestDay} up to today from the pasted export link.</p>
        <div class="url-actions">
          <button type="button" onclick={runFetchFromUrl} disabled={busy}>{busy ? 'Fetching…' : 'Fetch'}</button>
          <button type="button" onclick={() => (mode = 'menu')}>Back</button>
        </div>
      {/if}
      {#if error}<p class="error">{error}</p>{/if}
      {#if info}<p class="hint">{info}</p>{/if}
    </div>
  {/if}
</div>

<style>
  .import-menu {
    position: relative;
  }
  .import-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-color);
    font: inherit;
    cursor: pointer;
  }
  .import-btn:hover {
    background: var(--hover-bg);
  }
  .import-popover {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 10;
    width: 300px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.4rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .import-popover button,
  .import-popover .menu-item {
    text-align: left;
    font: inherit;
    font-size: 0.85rem;
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-color);
    cursor: pointer;
    white-space: nowrap;
  }
  .import-popover button:hover,
  .import-popover .menu-item:hover {
    background: var(--hover-bg);
  }
  .divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.3rem 0;
  }
  .section-label {
    margin: 0 0 0.2rem;
    padding: 0 0.6rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted-text);
  }
  .uploaded-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    max-height: 160px;
    overflow-y: auto;
  }
  .uploaded-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.3rem 0.6rem;
    font-size: 0.78rem;
    color: var(--text-color);
    border-radius: 6px;
  }
  .uploaded-list li:hover {
    background: var(--hover-bg);
  }
  .uploaded-list li span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .uploaded-list li button {
    padding: 0 0.2rem;
    font-size: 0.75rem;
    color: var(--muted-text);
    background: none;
    border: none;
    cursor: pointer;
  }
  .url-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--muted-text);
    padding: 0.3rem 0.4rem 0;
  }
  .url-label input {
    font: inherit;
    font-size: 0.8rem;
    padding: 0.4rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg);
    color: var(--text-color);
  }
  .url-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    padding: 0.3rem 0.4rem 0;
  }
  .url-actions button {
    font-size: 0.8rem;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg);
    color: var(--text-color);
    cursor: pointer;
  }
  .url-actions button:hover:not(:disabled) {
    background: var(--hover-bg);
  }
  .url-actions button:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--muted-text);
    padding: 0 0.4rem;
    margin: 0.3rem 0 0;
  }
  .error {
    font-size: 0.75rem;
    color: var(--warning-text);
    padding: 0 0.4rem;
    margin: 0.3rem 0 0;
  }
</style>
