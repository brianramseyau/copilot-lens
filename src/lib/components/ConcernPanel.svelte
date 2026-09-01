<script lang="ts">
  export interface ConcernItem {
    title: string;
    detail: string;
    severity: 'warning' | 'info';
  }

  interface Props {
    items: ConcernItem[];
  }

  let { items }: Props = $props();

  // Dismissals only live in memory, so they reset on the next page load.
  let dismissed = $state<Set<string>>(new Set());

  let visibleItems = $derived(items.filter((item) => !dismissed.has(item.title)));

  function dismiss(title: string) {
    dismissed = new Set(dismissed).add(title);
  }
</script>

{#if visibleItems.length > 0}
  <section class="concern-panel">
    <h2>Areas of Concern</h2>
    <ul>
      {#each visibleItems as item (item.title)}
        <li class="severity-{item.severity}">
          <span class="badge">{item.severity === 'warning' ? '⚠' : 'ℹ'}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </div>
          <button
            type="button"
            class="dismiss-btn no-print"
            onclick={() => dismiss(item.title)}
            aria-label={`Dismiss ${item.title}`}
          >
            ✕
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .concern-panel {
    border: 1px solid var(--warning-border);
    background: var(--warning-bg);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
  }
  .concern-panel h2 {
    margin: 0 0 0.6rem;
    font-size: 0.95rem;
    color: var(--warning-text);
  }
  .concern-panel ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .concern-panel li {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
  }
  .concern-panel li > div {
    flex: 1;
    min-width: 0;
  }
  .dismiss-btn {
    border: none;
    background: none;
    color: var(--muted-text);
    cursor: pointer;
    font-size: 0.8rem;
    line-height: 1.3;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
  }
  .dismiss-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--text-color);
  }
  .badge {
    font-size: 1.1rem;
    line-height: 1.3;
  }
  .concern-panel strong {
    display: block;
    font-size: 0.85rem;
    color: var(--text-color);
  }
  .concern-panel p {
    margin: 0.15rem 0 0;
    font-size: 0.8rem;
    color: var(--muted-text);
  }
  .severity-info .badge {
    opacity: 0.75;
  }
</style>
