<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
export default defineComponent({
  setup() {
    const loadScript = (src: string) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.id = 'supertokens-script';
      script.onload = () => {
        (window as any).supertokensUIInit('supertokensui', {
          appInfo: {
            // learn more about this on https://supertokens.com/docs/references/frontend-sdks/reference#sdk-configuration
            appName: 'Khub-Chaton',
            apiDomain: "http://localhost:3000",
            websiteDomain: "http://localhost:3000",
            apiBasePath: '/api/auth',
            websiteBasePath: '/auth',
          },
          style: `
              [data-supertokens~="container"] {
                 font-family: "Inter", sans-serif; 
              }
          `,
          recipeList: [
            (window as any).supertokensUIPasswordless.init({
              contactMethod: 'EMAIL_OR_PHONE',
            }),
            (window as any).supertokensUIThirdParty.init({
              signInAndUpFeature: {
                providers: [
                  (window as any).supertokensUIThirdParty.Github.init(),
                  (window as any).supertokensUIThirdParty.Google.init(),
                ],
              },
            }),
            (window as any).supertokensUISession.init(),
          ],
        });
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