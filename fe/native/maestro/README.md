# Mobile E2E — Maestro flows

The RN app (`fe/native`) shares `fe/app/src` through Metro, so web unit
tests already cover the shared logic (sessions, apiClient, RBAC, reducers).
These flows verify the parts only a device can: real navigation, native
primitives, and rendering.

## Setup (once per machine)

```bash
brew install maestro          # or: curl -fsSL https://get.maestro.mobile.dev | bash
cd fe/native && npm install
```

## Run

```bash
cd fe/native

# 1. start Metro
npm start

# 2. in another shell, build+install the dev client on a simulator
npx expo run:ios              # or: npx expo run:android

# 3. run the flows
maestro test maestro/launch.yaml
maestro test maestro/            # all flows
```

`APP_ID` env overrides the bundle id if the dev client registers a
different one (`appId` in each flow defaults to `com.nishify.app`).

Admin surfaces are intentionally web/desktop-only — the native shell
(`src/native/native-app.tsx`) renders the config-driven storefront and
menu screens; there is no native admin CRUD to assert yet.
