import Spin from "@assets/animates/spin";
import { A, useMatch } from "@solidjs/router";
import clsx from "clsx";
import { type ComponentProps, children, type JSX, Show } from "solid-js";
import type { ButtonProps } from "./button";

export type LinkProps = {
  activeMatch?: "exact" | "partial";
  active?: boolean;
  disabled?: boolean;
};

export default function (props: ComponentProps<"a"> & ButtonProps & LinkProps & { children?: JSX.Element }) {
  const match = useMatch(() => (props.activeMatch === "exact" ? props.href! : `${props.href}/*`));
  const className = () =>
    clsx(
      "btn",
      // btn-primary btn-info btn-success btn-warning btn-error
      !!props.level && `btn-${props.level}`,
      // btn-sm btn-md
      `btn-${props.size || "md"}`,
      props.ghost && "btn-ghost",
      props.bold && "btn-bold",
      // justify-start justify-center justify-end
      `justify-${props.justify || "center"}`,
      props.uppercase && "uppercase",
      props.square && "btn-square",
      props.activeMatch ? Boolean(match()) && "btn-active" : props.active && "btn-active",
      props.class,
      props.classList
    );
  return (
    <Show
      when={!props.disabled}
      fallback={
        <div class={className()} title={props.title}>
          {children(() => props.children)()}
        </div>
      }
    >
      <A {...props} href={props.href ?? "#"} type={props.type} class={className()}>
        <Show when={props.loading}>
          <Spin />
        </Show>
        {children(() => props.children)()}
      </A>
    </Show>
  );
}
