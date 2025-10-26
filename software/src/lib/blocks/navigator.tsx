import Logo from "@assets/logo-full.svg";
import { t } from "@storage/theme";
import Link from "@widgets/link";
import I18nBox from "./i18n-box";
import ThemeBox from "./theme-box";

export default function () {
  return (
    <div class="bg-layer-content/5 w-[calc(100vw-1.5rem)] h-16 fixed bottom-3 left-3 border rounded-xl border-layer-content/5 backdrop-blur flex items-center pr-2">
      <img src={Logo} class="h-16 w-auto transition-transform duration-300 hover:scale-105" alt="Keys Dock" />
      <div class="flex-1" />
      <div class="flex space-x-2 items-center">
        <I18nBox />
        <ThemeBox />
        <span />
        <Link href="https://github.com/Reverier-Xu/KeysDock" target="_blank" rel="noopener noreferrer">
          <span class="icon-[fluent--clover-20-regular] w-5 h-5" />
          <span class="font-extrabold">{t("navigator.getIt")}</span>
        </Link>
      </div>
    </div>
  );
}
