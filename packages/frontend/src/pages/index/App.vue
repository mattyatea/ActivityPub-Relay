<template>
  <MainLayout currentPage="home">
    <div class="home">
    <section class="hero">
      <h1>ActivityPub Relay</h1>
      <p>Connect your ActivityPub instance to the federated network</p>
      <a href="/admin/" class="cta-button">Admin Panel</a>
    </section>

    <section class="section">
      <h2>Features</h2>
      <div class="grid">
        <Card>
          <h3>Easy Integration</h3>
          <p>Integrate your ActivityPub instance with just a few clicks.</p>
        </Card>
        <Card>
          <h3>Secure</h3>
          <p>All communications are secured with HTTP Signatures.</p>
        </Card>
        <Card>
          <h3>Fast</h3>
          <p>Built on Cloudflare Workers for edge computing performance.</p>
        </Card>
        <Card>
          <h3>Filtering</h3>
          <p>Manage domain rules to control what gets relayed.</p>
        </Card>
      </div>
    </section>

    <section class="section">
      <h2>Getting Started</h2>
      <Card>
        <ol>
          <li>Subscribe to the relay from your instance</li>
          <li>Configure domain rules in the <a href="/admin/">Admin Panel</a></li>
          <li>Review and approve follow requests</li>
          <li>Monitor relay activity</li>
        </ol>
      </Card>
    </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import Card from '../../components/Card.vue';
import MainLayout from '../../layouts/MainLayout.vue';
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 80px 20px 60px;
}

.hero h1 {
  font-size: 32px;
  margin-bottom: 12px;
  font-weight: 600;
}

.hero p {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.cta-button {
  display: inline-block;
  background: var(--button-primary);
  color: var(--bg-primary);
  padding: 10px 24px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  border: 1px solid var(--button-primary);
}

.cta-button:hover {
  background: var(--button-primary-hover);
  border-color: var(--button-primary-hover);
}

.section {
  margin-bottom: 48px;
}

.section h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.grid h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.grid p {
  font-size: 14px;
  margin: 0;
}

ol {
  padding-left: 20px;
  margin: 0;
}

ol li {
  margin-bottom: 8px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .hero {
    padding: 48px 20px 40px;
  }

  .hero h1 {
    font-size: 24px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
