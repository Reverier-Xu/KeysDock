import rxSticker from "@assets/rx.webp";
import { t } from "@storage/theme";

export default function NotImplemented() {
  return (
    <div class="flex flex-col space-y-8 items-center justify-center">
      <img class="rounded-xl" src={rxSticker} width={256} height={256} alt="ΦωΦ" />
      <h1 class="font-bold text-3xl space-x-4">
        <span class="opacity-60">{t("general.notImplemented.hello")}</span>
        <span class="text-primary">|</span>
        <span>{t("general.notImplemented.title")}</span>
      </h1>
      <p class="opacity-60">{t("general.notImplemented.message")}</p>
    </div>
  );
}
