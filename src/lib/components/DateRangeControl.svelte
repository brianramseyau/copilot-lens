<script lang="ts">
  import type { DateRange } from '../data/aggregate';

  interface Props {
    range: DateRange;
    bounds: DateRange;
  }

  let { range = $bindable(), bounds }: Props = $props();

  function addDays(day: string, delta: number): string {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  function applyPreset(days: number) {
    const end = bounds.end;
    const candidateStart = addDays(end, -(days - 1));
    range = { start: candidateStart < bounds.start ? bounds.start : candidateStart, end };
  }

  function clampDay(day: string, min: string, max: string): string {
    if (day < min) return min;
    if (day > max) return max;
    return day;
  }

  function todayLocal(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function applyLastWeek() {
    // 0=Sunday..6=Saturday; find the Monday of the week containing today (not bounds.end).
    const today = todayLocal();
    const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
    const daysSinceMonday = (dow + 6) % 7;
    const thisMonday = addDays(today, -daysSinceMonday);
    const lastSunday = addDays(thisMonday, -1);
    const lastMonday = addDays(lastSunday, -6);
    range = {
      start: clampDay(lastMonday, bounds.start, bounds.end),
      end: clampDay(lastSunday, bounds.start, bounds.end),
    };
  }

  function resetFull() {
    range = { ...bounds };
  }
</script>

<div class="date-range-control">
  <div class="presets">
    <button type="button" onclick={() => applyPreset(7)}>Last 7 days</button>
    <button type="button" onclick={applyLastWeek}>Last week</button>
    <button type="button" onclick={() => applyPreset(14)}>Last 14 days</button>
    <button type="button" onclick={() => applyPreset(30)}>Last 30 days</button>
    <button type="button" onclick={resetFull}>Full range</button>
  </div>
  <div class="inputs">
    <label>
      From
      <input type="date" bind:value={range.start} min={bounds.start} max={range.end} />
    </label>
    <label>
      To
      <input type="date" bind:value={range.end} min={range.start} max={bounds.end} />
    </label>
  </div>
</div>

<style>
  .date-range-control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .presets {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .presets button {
    font-size: 0.8rem;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-color);
    cursor: pointer;
  }
  .presets button:hover {
    background: var(--hover-bg);
  }
  .inputs {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  .inputs label {
    display: flex;
    flex-direction: column;
    font-size: 0.7rem;
    color: var(--muted-text);
    gap: 0.2rem;
  }
  .inputs input {
    font: inherit;
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-color);
  }
</style>
