#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
  do
    if [[ -d "$candidate" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  for candidate in \
    /opt/homebrew/share/android-commandlinetools \
    /usr/local/share/android-commandlinetools \
    "$HOME/Library/Android/sdk"
  do
    if [[ -d "$candidate" ]]; then
      export ANDROID_HOME="$candidate"
      export ANDROID_SDK_ROOT="$candidate"
      break
    fi
  done
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
  echo "JAVA_HOME is not set, and no Homebrew OpenJDK 21 installation was found." >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  echo "ANDROID_HOME / ANDROID_SDK_ROOT is not set, and no Android SDK installation was found." >&2
  exit 1
fi

export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$JAVA_HOME/bin:$PATH"

cd "$ROOT_DIR"
npx cap sync android
cd android
./gradlew assembleDebug
