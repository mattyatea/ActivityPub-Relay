<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <p>&copy; 2024 ActivityPub Relay. All rights reserved.</p>
        <p>
          <a href="https://activitypub.rocks/" target="_blank" rel="noopener">ActivityPub Spec</a>
          •
          <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts"></script>

<style scoped>
.footer {
  border-top: 1px solid var(--border-color);
  margin-top: 64px;
  padding: 24px 20px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-content {
  text-align: center;
}

.footer-content p {
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.footer-content a {
  color: var(--text-primary);
  text-decoration: none;
}

.footer-content a:hover {
  text-decoration: underline;
}
</style>
