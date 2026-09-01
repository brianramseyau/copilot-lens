const ACRONYMS = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['cli', 'CLI'],
  ['ide', 'IDE'],
  ['loc', 'LOC'],
  ['gpt', 'GPT'],
]);

function titleWord(word: string): string {
  const lower = word.toLowerCase();
  return ACRONYMS.get(lower) ?? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

export function formatFeatureName(name: string): string {
  return name
    .trim()
    .split(/[_-]+/)
    .filter(Boolean)
    .map(titleWord)
    .join(' ');
}

const LANGUAGE_NAMES = new Map([
  ['tsx', 'TSX'], ['ts', 'TS'], ['typescript', 'TypeScript'],
  ['js', 'JS'], ['javascript', 'JavaScript'], ['jsx', 'JSX'],
  ['php', 'PHP'], ['sql', 'SQL'], ['json', 'JSON'], ['jsonc', 'JSONC'],
  ['yaml', 'YAML'], ['xml', 'XML'], ['css', 'CSS'], ['html', 'HTML'],
  ['http', 'HTTP'], ['hcl', 'HCL'], ['graphql', 'GraphQL'],
  ['powershell', 'PowerShell'], ['dockercompose', 'Docker Compose'],
  ['plaintext', 'Plain Text'], ['shellscript', 'Shell Script'],
]);

export function formatLanguageName(name: string): string {
  const trimmed = name.trim();
  return LANGUAGE_NAMES.get(trimmed.toLowerCase()) ?? formatFeatureName(trimmed);
}

export function formatModelName(name: string): string {
  const trimmed = name.trim();
  const autoPrefix = /^auto:\s*/i.test(trimmed) ? 'Auto: ' : '';
  const model = trimmed.replace(/^auto:\s*/i, '');
  const lower = model.toLowerCase();

  if (lower === 'others') return `${autoPrefix}Other Models`;
  if (lower === 'auto') return 'Auto';

  const gpt = lower.match(/^gpt[- ](\d+(?:\.\d+)*)(?:[- ](.+))?$/);
  if (gpt) {
    const suffix = gpt[2];
    if (!suffix) return `${autoPrefix}GPT-${gpt[1]}`;
    const suffixName = suffix.split(/[-_ ]+/).map(titleWord).join(' ');
    const separator = suffix.toLowerCase() === 'codex' ? '-' : ' ';
    return `${autoPrefix}GPT-${gpt[1]}${separator}${suffixName}`;
  }

  const claude = lower.match(/^claude[- ](.+)$/);
  if (claude) {
    const parts = claude[1].split(/[-_ ]+/);
    if (/^\d+(?:\.\d+)*$/.test(parts[0]) && parts.length > 1) {
      const [version, ...family] = parts;
      return `${autoPrefix}Claude ${family.map(titleWord).join(' ')} ${version}`;
    }
    return `${autoPrefix}Claude ${parts.map(titleWord).join(' ')}`;
  }

  return `${autoPrefix}${model.split(/[_-]+/).filter(Boolean).map(titleWord).join(' ')}`;
}
