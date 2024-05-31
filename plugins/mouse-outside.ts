import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('mouse-outside', {
    mounted(el, binding) {
      // Use a more descriptive handler name to reflect its purpose
      el.__vueMouseOutsideHandler__ = (event: MouseEvent) => {
        // Check if the mouse movement is outside the element
        if (!(el === event.target || el.contains(event.target))) {
          // Call the provided method
          binding.value(event);
        }
      };
      // Listen for mouse move events on the document
      document.addEventListener('mousemove', el.__vueMouseOutsideHandler__);
    },
    beforeUnmount(el) {
      // Clean up: Remove the event listener when the component is unmounted
      document.removeEventListener('mousemove', el.__vueMouseOutsideHandler__);
      delete el.__vueMouseOutsideHandler__;
    },
  });
});
