<script setup lang="ts"></script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="flex justify-between items-end mb-4 flex-none">
      <div class="text-base font-semibold">Extension</div>
      <div
        class="flex text-xs space-x-4 text-neutral-400 dark:text-neutral-500 cursor-pointer"
      >
        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
        >
          Installed
        </div>
        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
        >
          Marketplace
        </div>
      </div>
    </div>
    <div class="bg-neutral-500 flex grow">Market</div>
    <div class="bg-neutral-500 flex grow">Installed</div>
  </div>
</template>
