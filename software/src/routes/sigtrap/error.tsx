import platformAvatar from "@assets/rx.webp";
import teapot from "@assets/teapot.svg";
import { t } from "@storage/theme";
import { Match, Switch } from "solid-js";

export default function (props: { status: number | null }) {
  const messages: Record<number, string> = {
    401: t("general.network.status.401.title"),
    403: t("general.network.status.403.title"),
    404: t("general.network.status.404.title"),
    412: t("general.network.status.412.title"),
    418: t("general.network.status.418.title"),
    500: t("general.network.status.500.title"),
    502: t("general.network.status.502.title"),
  };

  const tips: Record<number, string> = {
    401: t("general.network.status.401.message"),
    403: t("general.network.status.403.message"),
    404: t("general.network.status.404.message"),
    412: t("general.network.status.412.message"),
    418: t("general.network.status.418.message"),
    500: t("general.network.status.500.message"),
    502: t("general.network.status.502.message"),
  };

  const message = () => messages[props.status!] || t("general.network.unknown.title");
  const tip = () => tips[props.status!] || t("general.network.unknown.message");

  return (
    <div class="flex-1 flex flex-col items-center justify-center space-y-8">
      <Switch fallback={<img class="rounded-xl" src={platformAvatar} width={256} height={256} alt="TωT" />}>
        <Match when={props.status === 418}>
          <img class="rounded-xl" src={teapot} width={256} height={256} alt="TωT" />
        </Match>
        {/* <Match when={props.status && props.status >= 500}> */}
        {/*   <img src={xdsecMascotCrying} width={256} height={256} alt="TωT" /> */}
        {/* </Match> */}
        {/* <Match when={props.status && props.status < 500}> */}
        {/*   <img src={xdsecMascotUnsee} width={256} height={256} alt="TωT" /> */}
        {/* </Match> */}
      </Switch>
      <h1 class="font-bold text-3xl space-x-4">
        <span class="opacity-60">{props.status}</span>
        <span class="text-primary">|</span>
        <span>{message()}</span>
      </h1>
      <p class="opacity-60">{tip()}</p>
    </div>
  );
}
