<script setup lang="ts">

const onMigrateLocalClicked = async () => {
  await categorizerService.migrateCloudToLocal();
  await paperService.migrateCloudToLocal();
  await categorizerService.migrateCloudCountToLocal();
  await feedService.migrateCloudToLocal();
  await smartFilterService.migrateCloudToLocal();

  preferenceService.set({ useSync: false });

  await databaseService.initialize();
  await databaseService.deleteSyncCache()

};

</script>

<template>
  <div
    class="absolute w-full h-full top-0 left-0"
  >
    <div
      class="flex flex-col justify-center items-center w-full h-full bg-neutral-800 bg-opacity-50 dark:bg-neutral-900 dark:bg-opacity-80 dark:text-neutral-300"
    >
      <div
        class="m-auto flex flex-col justify-between px-6 py-6 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[80%] h-[80%] rounded-lg shadow-lg select-none space-y-5"
      >
        <div class="mx-auto font-semibold text-xl flex-none">Important Notification</div>
        <div class="grow overflow-scroll flex flex-col space-y-5">
          <span class="font-bold">
            ⚠️⚠️⚠️ Please migrate your cloud data to the local database! ⚠️⚠️⚠️
          </span>
          <span>
            Due to the depracation of MongoDB's cloud database functionality, we have had to temporarily disable our cloud sync feature. Please click the button below to transfer all your cloud data to a local database to prevent data loss.
          </span>
          <span>
            We understand the importance of the cloud sync feature, and we are currently testing our own cloud sync solution. This has proven to be more challenging than we anticipated, but we are working hard to perfect it. We currently only have two part-time PhD student developers. If you are willing to help us, please contact me.
          </span>

          <span class="font-bold">
            ⚠️⚠️⚠️ 请迁移你的云端数据库数据到本地数据库! ⚠️⚠️⚠️
          </span>
          <span>
            因为 MongoDB 停止了云数据库功能，我们不得不暂时下线我们的云同步功能。请点击下面的按钮，将所有云数据传输到本地数据库防止丢失数据。 
          </span>
          <span>
            我们理解云同步功能的重要性，因此我们正在测试我们自己的云同步功能。这比我们想象中的更难，但是我们正在努力完善它。我们目前只有两名博士生兼职开发人员，如果你愿意帮助我们，请联系我。 
          </span>


        </div>
        <div
          id="delete-confirm-btn"
          class="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm w-20 mx-auto flex-none"
          @click="onMigrateLocalClicked"
        >
          <span class="m-auto text-xs">
            Migrate Now
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
