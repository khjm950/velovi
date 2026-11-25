# Android debug build

Velovi's Android project is generated from the current web application sources by the GitHub Actions workflow at `.github/workflows/android-apk.yml`.

## Run a build

- Open the repository's **Actions** tab.
- Select **Velovi Android APK**.
- Choose **Run workflow** on the `main` branch.

The workflow installs the pinned Capacitor toolchain, stages the current web assets (including `guide.js`), generates the Android project, applies the app identity and Android hardening, and builds a signed debug APK.

## Download the test APK

After a successful run, open the run's **Artifacts** section and download `velovi-debug-apk`. The artifact is retained for 14 days.

This is a debug build for internal testing. A Google Play release requires a separately configured release signing key and an Android App Bundle (AAB). Never commit signing keys or passwords to this repository.
