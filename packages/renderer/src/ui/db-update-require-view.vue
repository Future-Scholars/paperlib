<script setup lang="ts">
import { onMounted, ref } from "vue";

const show = ref(false);

const checkShouldShow = async () => {
  show.value = await window.appInteractor.shouldShowDBUpdateRequire();
};

const hide = () => {
  show.value = false;
  window.appInteractor.hideDBUpdateRequire();
};

onMounted(() => {
  checkShouldShow();
});
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      id="whats-new-view"
      class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 pt-20 pb-48 overflow-auto dark:text-neutral-200"
      v-if="show"
    >
      <div class="w-[40rem] h-screen px-3 mx-auto">
        <img class="w-20 mx-auto mb-2" src="../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          Database Scheme is Updated in this version
        </p>
        <p class="mt-10">
          It seems that you are using MongoDB Atlas to sync database between
          different devices. As the data schemes are updated in this version, it
          requires you to turn on the <b>DEV Mode</b> of your cloud database to
          upload the new data schemes.
        </p>
        <p class="mt-2">
          似乎您正在使用 MongoDB Atlas
          来在不同设备间同步数据库，本版本对数据库表进行了更新，因此需要您打开云数据库的
          <b>DEV Mode</b> 功能来自动更新云端数据库表。
        </p>
        <p class="mt-10 text-red-500">
          ⚠️ If you've already turned it on, please ignore the following guide.
          Otherwise, please turn it on and then restart Paperlib.
        </p>
        <p class="mt-2 text-red-500">
          ⚠️ 如果您已经打开了这个设置，请忽略以下。否则请打开并重启 Paperlib。
        </p>

        <p class="mt-10 font-bold">How to turn on DEV Mode?</p>
        <li>Go to https://realm.mongodb.com/</li>
        <li>Click 'App Services'</li>
        <li>
          In your APP dashboard, click Device Sync section and turn on the DEV
          mode.
        </li>
        <li>Save Changes.</li>
        <li><b>Restart Paperlib</b></li>
        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/db.jpg"
        />

        <div
          class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
          @click="hide"
        >
          <span class="m-auto">Close</span>
        </div>

        <div class="w-full h-20"></div>
      </div>
      <div
        class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800"
      ></div>
    </div>
  </Transition>
</template>
