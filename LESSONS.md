# Lessons Learned

## 2026-09-14 — Design system uplift (Farmhouse Kitchen)

- **Google Fonts no longer serves true static per-weight files for most
  families.** Both the modern (`css2?family=Font:wght@400;600`) and legacy
  (`css?family=Font:400,600`) endpoints returned the *same* file URL for
  every requested weight for Fraunces and Karla — they're variable-only now.
  For a React Native app (where `expo-font`'s `useFonts` maps one file to
  one `fontFamily` name, with no runtime variable-axis control), this means
  only the default (400) instance is usable without extra tooling. Fix used:
  fetch the variable `.woff2`, convert to `.ttf` with `fontTools` (pip
  install into a throwaway venv — the system Python is externally managed),
  and ship one weight per face. If multi-weight static type is needed later,
  either pick a family that still ships true static instances (checked via
  the google/fonts GitHub repo's `ofl/<family>/static/` folder — not all
  families have one anymore) or take on the `@expo-google-fonts/*` package
  dependency instead.
- **A shared Ideogram MCP account can be heavily queued.** Generation
  requests from many unrelated sessions interleave in the same queue;
  `get_generation_status` with no `request_id` returns *everyone's* recent
  jobs, not just this session's. Only poll for your own `request_id` and
  expect real wait times (multiple minutes) rather than the near-instant
  turnaround you'd get on a dedicated account.
- **RN apps with no shared `<Button>`/`<Card>` components can still get an
  app-wide font identity cheaply**: patch `Text.defaultProps.style` /
  `TextInput.defaultProps.style` once in the root `App.tsx` rather than
  touching every screen's `StyleSheet.create`. Screens that already read
  weight/size from theme tokens (`typography.sizes.h1`, etc.) inherit the
  new font automatically with zero risk of behavioral regression.
