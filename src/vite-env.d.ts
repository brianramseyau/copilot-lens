/// <reference types="vite/client" />

declare module 'virtual:copilot-data' {
  import type { IngestResult } from './lib/data/types';
  const data: IngestResult;
  export default data;
}
