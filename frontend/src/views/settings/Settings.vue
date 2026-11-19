<script setup>
import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
    <div class="layout">
        <AppHeader />

        <main class="content">
            <h1>Settings</h1>
        </main>
    </div>
</template>

<style scoped>
.layout {
    min-height: 100vh;
    background: #f5f5f5;
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
}

.content {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px;
    box-sizing: border-box;
}

h1 {
    margin: 0;
    font-size: 22px;
}
</style>
