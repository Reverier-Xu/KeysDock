import Keyboard from "@blocks/keyboard";

export default function () {
  return (
    <div class="flex-1 flex flex-row">
      <div class="flex-1 flex flex-col items-center">
        <div class="flex-1" />
        <Keyboard upPlugged />
        <div class="flex-1" />
        <div class="flex justify-end w-full px-6 py-2">
          <a class="opacity-40" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">豫ICP备20023182号-2</a>
          <span class="opacity-40 text-primary">&nbsp;|&nbsp;</span>
          <a class="opacity-40" href="https://beian.mps.gov.cn/#/query/webSearch" target="_blank" rel="noopener noreferrer">豫公网安备41159002000165号</a>
        </div>
        <div class="h-20" />
      </div>
    </div>
  );
}
