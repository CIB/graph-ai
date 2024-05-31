<template>
  <v-chip-group :column="true">
    <v-menu open-on-hover bottom v-for="item in contextItems" :key="item.title">
      <template v-slot:activator="{ props }">
        <v-chip outlined v-bind="props">
          {{ item.title }}
        </v-chip>
      </template>
      <v-card>
        <v-card-item class="popup"><div :innerHTML="md.render(item.text)"></div></v-card-item>
      </v-card>
    </v-menu>
  </v-chip-group>
</template>

<script setup lang="ts">
import type { ContextItem } from './context-item';
import { defineProps } from 'vue';
import markdownit from 'markdown-it';

const md = markdownit();

const props = defineProps<{
  contextItems: ContextItem[];
}>();
</script>

<style scoped>
.v-chip {
  margin-right: 10px;
}

.v-card-title {
  padding-bottom: 0;
}

.popup {
  max-width: 600px;
}
</style>
