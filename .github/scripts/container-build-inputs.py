import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


BUILD_INPUTS_LABEL = "de.ddb.labs.ddbapi.build-inputs"
TAGGED_IMAGE = re.compile(
    r"[a-z0-9][a-z0-9./_-]*(?::[0-9]+/[a-z0-9./_-]+)?:[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}"
)
DIGEST = re.compile(r"sha256:[0-9a-f]{64}")
PLATFORM = re.compile(r"[a-z0-9]+/[a-z0-9]+(?:/[a-z0-9]+)?")


def inspect(image, *options, allow_missing=False):
    result = subprocess.run(
        ["docker", "buildx", "imagetools", "inspect", *options, image],
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return result.stdout
    error = result.stderr.decode(errors="replace").strip()
    if allow_missing and (
        f"{image.lower()}: not found" in error.lower() or "manifest unknown" in error.lower()
    ):
        return None
    raise SystemExit(error or f"Could not inspect {image}.")


def base_images(dockerfile):
    names = []
    for number, line in enumerate(dockerfile.read_text(encoding="utf-8").splitlines(), 1):
        fields = line.split()
        if not fields or fields[0].upper() != "FROM":
            continue
        if len(fields) < 2 or not TAGGED_IMAGE.fullmatch(fields[1]):
            raise SystemExit(f"{dockerfile}:{number}: expected a FROM instruction with a literal image tag.")
        names.append(fields[1])
    if not names:
        raise SystemExit(f"No base image tags found in {dockerfile}.")
    return names


def manifest_digest(raw_manifest):
    # Buildx --raw returns the original manifest bytes without a trailing newline.
    return "sha256:" + hashlib.sha256(raw_manifest).hexdigest()


def platform_matches(details, target):
    platform = "/".join(details.get(key) or "" for key in ("os", "architecture", "variant"))
    return platform.rstrip("/") == target


def image_config(image, digest):
    return json.loads(inspect(f"{image}@{digest}", "--format", "{{json .Image}}"))


def platform_digest(image, target):
    raw_manifest = inspect(image, "--raw")
    manifest = json.loads(raw_manifest)
    if "manifests" in manifest:
        for entry in manifest["manifests"]:
            if platform_matches(entry.get("platform") or {}, target):
                digest = entry.get("digest") or ""
                if not DIGEST.fullmatch(digest):
                    raise SystemExit(f"Invalid {target} digest for {image}.")
                return digest
    else:
        digest = manifest_digest(raw_manifest)
        if platform_matches(image_config(image, digest) or {}, target):
            return digest
    raise SystemExit(f"No {target} image found for {image}.")


def reusable_digest(image, target, fingerprint):
    raw_manifest = inspect(image, "--raw", allow_missing=True)
    if raw_manifest is None or "manifests" in json.loads(raw_manifest):
        return None

    digest = manifest_digest(raw_manifest)
    config = image_config(image, digest) or {}
    labels = (config.get("config") or {}).get("Labels") or {}
    if platform_matches(config, target) and labels.get(BUILD_INPUTS_LABEL) == fingerprint:
        return digest
    return None


def main():
    platform = os.environ.get("TARGET_PLATFORM", "linux/amd64")
    if not PLATFORM.fullmatch(platform):
        raise SystemExit(f"Invalid target platform: {platform}.")

    dockerfile = Path(os.environ.get("RELEASE_DOCKERFILE", "release-source/Dockerfile"))
    names = base_images(dockerfile)
    bases = {name: platform_digest(name, platform) for name in dict.fromkeys(names)}
    inputs = json.dumps([os.environ["RELEASE_REVISION"], platform, bases], sort_keys=True).encode()
    fingerprint = hashlib.sha256(inputs).hexdigest()
    release_image = f"{os.environ['IMAGE']}:{os.environ['RELEASE_TAG']}"
    digest = reusable_digest(release_image, platform, fingerprint)

    with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
        if digest:
            print(f"reusable_digest={digest}", file=output)
            print(f"Reusing {release_image} with unchanged build inputs.")
            return

        runtime = names[-1]
        print(f"base_name={runtime}", file=output)
        print(f"base_digest={bases[runtime]}", file=output)
        print(f"fingerprint={fingerprint}", file=output)
        print("contexts<<BASE_IMAGES", file=output)
        for name, digest in bases.items():
            print(f"{name}=docker-image://{name}@{digest}", file=output)
        print("BASE_IMAGES", file=output)
        print(f"Building {release_image} because its tag is missing or the build inputs changed.")


if __name__ == "__main__":
    main()
