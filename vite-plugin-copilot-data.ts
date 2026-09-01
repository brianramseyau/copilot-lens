import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { parseNdjson, dedupeRecords } from './src/lib/data/parse.js';
import { parseCostCsv } from './src/lib/data/csv.js';
import type { CostRecord, IngestResult, UsageRecord } from './src/lib/data/types.js';

const VIRTUAL_ID = 'virtual:copilot-data';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Reads every *.ndjson file in `usageDir` and every *.csv file in `costDir`
 * at build/dev time and exposes the combined, de-duplicated usage dataset
 * (plus the raw cost rows) as the `virtual:copilot-data` module. Cost rows
 * are not filtered here — the app filters them client-side against whichever
 * users are currently in the usage dataset. In dev mode, changes to either
 * directory trigger a full reload.
 */
export function copilotDataPlugin(usageDir: string, costDir: string): Plugin {
  function loadData(): IngestResult {
    const usageFiles = existsSync(usageDir) ? readdirSync(usageDir).filter((f) => f.endsWith('.ndjson')).sort() : [];
    let allUsage: UsageRecord[] = [];
    for (const file of usageFiles) {
      const text = readFileSync(join(usageDir, file), 'utf-8');
      allUsage = allUsage.concat(parseNdjson(text));
    }
    const { deduped, duplicateCount } = dedupeRecords(allUsage);

    const costFiles = existsSync(costDir) ? readdirSync(costDir).filter((f) => f.endsWith('.csv')).sort() : [];
    let allCost: CostRecord[] = [];
    for (const file of costFiles) {
      const text = readFileSync(join(costDir, file), 'utf-8');
      allCost = allCost.concat(parseCostCsv(text));
    }

    return { records: deduped, duplicateCount, files: usageFiles, cost: { records: allCost, files: costFiles } };
  }

  return {
    name: 'copilot-data',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(loadData())};`;
      }
    },
    configureServer(server) {
      server.watcher.add(usageDir);
      server.watcher.add(costDir);
      server.watcher.on('all', (_event, changedPath) => {
        if (changedPath.startsWith(usageDir) || changedPath.startsWith(costDir)) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
