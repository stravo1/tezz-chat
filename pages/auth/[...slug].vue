<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import { initSuperTokensUI, initSuperTokensWebJS } from '~/config/frontend';

export default defineComponent({
  setup() {
    const loadScript = (src: string) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.id = 'supertokens-script';
      script.onload = () => {
        initSuperTokensWebJS();
        initSuperTokensUI();
      };
      document.body.appendChild(script);
    };

    onMounted(() => {
      loadScript(
        'https://cdn.jsdelivr.net/gh/supertokens/prebuiltui@v0.48.0/build/static/js/main.81589a39.js',
      );
    });

    onUnmounted(() => {
      const script = document.getElementById('supertokens-script');
      if (script) {
        script.remove();
      }
    });
  },
});
</script>

<template>
  <div id="supertokensui"></div>
</template>