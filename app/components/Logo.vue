<template>
  <NuxtLink class="navbar-logo" to="/">
    <div class="flex items-center">
      <div class="flex items-center lg:mr-5">
        <div class="mr-2">
          <img src="/logo-dark.svg" alt="Unlighthouse Logo" class="block dark:hidden text-black dark:text-white w-5 h-5">
          <img src="/logo-light.svg" alt="Unlighthouse Logo" class="hidden dark:block text-black dark:text-white w-5 h-5">
        </div>
        <div class="flex flex-col">
          <h1 class="font-bold text-xl">
            Unlighthouse
          </h1>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
