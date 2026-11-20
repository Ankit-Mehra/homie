# Homie mobile

Expo / React Native app for iOS and Android in the shared Homie repository. Run the commands below from `mobile/`, including EAS commands. Mobile CI lives at `../.github/workflows/mobile.yml`; the API is reached over HTTPS.

Uses Expo SDK 57 with React Native 0.86 and React 19.2.3. Use an SDK 57-compatible Expo Go or rebuild your development client after upgrading.

TypeScript stays on 5.9 because `openapi-typescript` 7 declares a TypeScript 5 peer dependency. It is intentionally excluded from Expo dependency alignment until the generator supports TypeScript 6.

## Local development

```sh
cp .env.example .env
npm ci
npm start
```

Set `EXPO_PUBLIC_API_URL` to the backend. iOS simulator uses localhost; Android emulator uses `http://10.0.2.2:8000`; physical devices use your computer's LAN IP. The fixed local token works only in development with the backend's explicit development authentication enabled.

```sh
npm run generate:api
npm run typecheck
npm run lint
npm run format
npm test -- --watchman=false
```

The OpenAPI snapshot in `contracts/` makes contract generation independent of sibling folders. See `contracts/README.md` for updates.

## Store builds and submission

`eas.json` defines internal preview and production store profiles, remote build numbering, and an Android App Bundle. These follow [Expo EAS configuration](https://docs.expo.dev/eas/json/).

Before the first store build:

1. Link this app directory to your Expo project with `eas init` (using the EAS CLI).
2. Confirm ownership of the final iOS bundle identifier and Android package name in `app.json`; `com.homie.app` is currently a placeholder and must be settled before creating store records.
3. Configure `EXPO_PUBLIC_API_URL` in the EAS production environment to your Railway HTTPS URL. The production profile disables local authentication.
4. Configure Apple Developer / App Store Connect and Google Play accounts, app records, signing credentials and submission credentials. Add the real App Store Connect app ID to the submit profile when known. Do not commit private keys.

```sh
eas build --platform all --profile production
# After release checks and review:
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

No cloud build, account setup or submission has been performed. Native bundles export successfully, but signing, device testing and store review remain unverified. The product is not ready for submission: live sign-in verification, live discovery, chat/maintenance features, privacy declarations, store assets and remaining specification gates are unfinished. Store publication is a separate explicit release step.

Known dependency issue: 10 moderate npm audit findings in Expo's xcode/uuid build-tool chain; no high/critical findings at the foundation check. Resolve before distribution.

## Real sign-in and first item

Set these in `.env` (restart Expo after changing them) or the EAS environment:

```dotenv
EXPO_PUBLIC_API_URL=https://homie-backend-production-b314.up.railway.app
EXPO_PUBLIC_DEV_AUTH=false
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-ENVOY-DOMAIN
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-OR-PUBLISHABLE-KEY
```

Never use a service-role key or JWT signing secret in the mobile app. Supabase
sessions persist locally and refresh while the app is active. Sign-out removes
this device's session and discards its household query cache.

Deploy backend `/v1/me` and `/v1/me/household` endpoints first. Enable email/password
sign-ups in GoTrue. If email confirmation is enabled, configure SMTP and a valid
confirmation redirect (`GOTRUE_SITE_URL`); confirm in the browser, then return to
the app and sign in. Automatic email-link sign-in and password recovery are not
implemented in this milestone.

Device acceptance check:

1. Create account A, confirm email if required, and sign in.
2. Choose **Create my household**, then **Add your first item**.
3. Save a name, brand, model, category, and optional room; confirm the model.
4. Close and reopen the app. Verify the session and saved item are restored.
5. Sign out, create account B, and create its household. Its inventory must be empty.
6. Sign back into A. Its item must still be present.

Automated tests use mocked Supabase responses; live email delivery, signing
configuration, and native device persistence still require this device check.
