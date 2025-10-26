import { setLocale } from "@storage/theme";
import Button from "@widgets/button";
import Card from "@widgets/card";
import Popover from "@widgets/popover";

export function I18nBoxContent() {
  return (
    <div class="flex flex-col space-y-2 max-w-64">
      <Card contentClass="p-2 flex flex-col space-y-2">
        <ul class="flex flex-row space-x-2">
          <li>
            <Button square onClick={() => setLocale("zh_cn")} ghost justify="center" size="sm">
              <span>简</span>
            </Button>
          </li>
          <li>
            <Button square onClick={() => setLocale("zh_tw")} ghost justify="center" size="sm">
              <span>繁</span>
            </Button>
          </li>
          <li>
            <Button square onClick={() => setLocale("en_us")} ghost justify="center" size="sm">
              <span>En</span>
            </Button>
          </li>
          <li>
            <Button square onClick={() => setLocale("ja_jp")} ghost justify="center" size="sm">
              <span>な</span>
            </Button>
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default function I18nBox() {
  return (
    <Popover
      btnContent={<span class="shrink-0 icon-[fluent--local-language-20-regular] w-5 h-5" />}
      square
      ghost
      positioning={{
        placement: 'top'
      }}
      popContentClass="pt-2"
    >
      <I18nBoxContent />
    </Popover>
  );
}
