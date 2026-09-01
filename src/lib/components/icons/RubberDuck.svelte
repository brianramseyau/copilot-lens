<script lang="ts">
  import { Icon, type IconNode, type IconProps } from '@lucide/svelte';

  let props: IconProps = $props();

  const iconNode: IconNode = [
    ['path', { d: 'M9 13V8a5 5 0 0 1 10 0v1' }],
    ['path', { d: 'M19 8h3l-2.5 3H17' }],
    ['path', { d: 'M17 11c0 2.8 1.8 4 4 4 0 3-3.1 5-8 5H8a5 5 0 0 1-5-5v-2h6' }],
    ['circle', { cx: '15', cy: '6.5', r: '.5', fill: 'currentColor' }],
  ];
</script>

<Icon name="rubber-duck" {...props} {iconNode} />
