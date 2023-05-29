<script setup lang="ts">
const route = useRoute()
const isRoot = computed(() => route.path === '/')
</script>

<template>
  <NavBar />
  <Container of-auto>
    <KeepAlive>
      <IdList />
    </KeepAlive>
  </Container>
  <div
    pos="fixed bottom-0 left-0 right-0 top-0"
    flex overflow-hidden bg-black:50 transition-all
    :class="isRoot ? 'pointer-events-none opacity-0' : 'opacity-100'"
  >
    <RouterLink h-full min-w-70px flex-auto to="/" />
    <div
      class="h-full w-[calc(100vw-100px)] transform overflow-hidden shadow-lg transition-transform duration-300 bg-main"
      border="l main"
      :class="isRoot ? 'translate-x-1/2' : 'translate-x-0'"
    >
      <Suspense>
        <RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
        <template #fallback>
          Loading...
        </template>
      </Suspense>
    </div>
  </div>
</template>
