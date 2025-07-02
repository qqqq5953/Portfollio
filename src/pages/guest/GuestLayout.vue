<template>
  <nav>
    <RouterLink to="/">Go to Home</RouterLink>
    <RouterLink to="/about">Go to About</RouterLink>
    <RouterLink to="/admin">Go to Admin</RouterLink>
  </nav>
  <!-- for different pages under guest -->
  <RouterView />
</template>
