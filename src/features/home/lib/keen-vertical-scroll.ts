import type { KeenSliderPlugin } from "keen-slider";

/**
 * Libera o scroll vertical da página quando o gesto começa no carousel.
 * Em capture, segura os touchmove até saber o eixo; se for vertical,
 * bloqueia o keen (evita preventDefault e tela travada no mobile).
 */
export const allowVerticalScroll: KeenSliderPlugin = (slider) => {
  let origin: { x: number; y: number } | null = null;
  let axis: "h" | "v" | null = null;

  function reset() {
    origin = null;
    axis = null;
  }

  function onStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    origin = { x: t.clientX, y: t.clientY };
    axis = null;
  }

  function onMove(e: TouchEvent) {
    if (!origin) return;

    if (axis === "v") {
      e.stopPropagation();
      return;
    }

    if (axis === "h") return;

    const t = e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - origin.x);
    const dy = Math.abs(t.clientY - origin.y);

    // Ainda incerto: não deixa o keen assumir o gesto.
    if (dx < 10 && dy < 10) {
      e.stopPropagation();
      return;
    }

    if (dy >= dx) {
      axis = "v";
      slider.animator.stop();
      e.stopPropagation();
      return;
    }

    axis = "h";
  }

  slider.on("created", () => {
    const el = slider.container;
    el.style.touchAction = "pan-y";
    el.addEventListener("touchstart", onStart, { passive: true, capture: true });
    el.addEventListener("touchmove", onMove, { passive: true, capture: true });
    el.addEventListener("touchend", reset, { passive: true, capture: true });
    el.addEventListener("touchcancel", reset, { passive: true, capture: true });
  });

  slider.on("destroyed", () => {
    const el = slider.container;
    el.removeEventListener("touchstart", onStart, true);
    el.removeEventListener("touchmove", onMove, true);
    el.removeEventListener("touchend", reset, true);
    el.removeEventListener("touchcancel", reset, true);
  });
};
