#!/usr/bin/env python3
"""Sync local music directories into data/music/generated.json.

Scans static/music/, reads each track directory's info.json, and writes a
playlist file consumed by the Hugo template and the browser player.

Usage:
    python scripts/sync_music.py
"""

import json
import os
import sys

AUDIO_EXTS = {".mp3", ".m4a", ".ogg", ".wav", ".flac"}
COVER_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

PREFERRED_AUDIO_STEMS = ("music",)
PREFERRED_COVER_STEMS = ("cover", "folder")

SKIP_DIR_PREFIXES = (".", "_")
SKIP_DIR_PREFIX_WORDS = ("example", "template", "sample")


def project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def music_root():
    return os.path.join(project_root(), "static", "music")


def static_root():
    return os.path.join(project_root(), "static")


def posix_rel(path, base):
    return os.path.relpath(path, base).replace(os.sep, "/")


def should_skip_dir(name):
    if name.startswith(SKIP_DIR_PREFIXES):
        return True
    lowered = name.lower()
    for word in SKIP_DIR_PREFIX_WORDS:
        if lowered.startswith(word):
            return True
    return False


def pick_file(files, preferred_stems):
    """Pick a file preferring the given stems, then the first sorted entry."""
    for stem in preferred_stems:
        for f in files:
            if os.path.splitext(f)[0].lower() == stem:
                return f
    return sorted(files)[0] if files else None


def scan_directory(dirpath):
    """Return (audio_abs, cover_abs, warnings) or None if no valid audio."""
    try:
        entries = os.listdir(dirpath)
    except OSError as exc:
        return None

    files = [e for e in entries if os.path.isfile(os.path.join(dirpath, e))]
    audio_files = [f for f in files if os.path.splitext(f)[1].lower() in AUDIO_EXTS]
    cover_files = [f for f in files if os.path.splitext(f)[1].lower() in COVER_EXTS]

    if not audio_files:
        return None

    warnings = []

    audio_name = pick_file(audio_files, PREFERRED_AUDIO_STEMS)
    if len(audio_files) > 1:
        warnings.append("multiple audio files found, selected %r" % audio_name)

    cover_name = pick_file(cover_files, PREFERRED_COVER_STEMS) if cover_files else None
    if len(cover_files) > 1:
        warnings.append("multiple cover files found, selected %r" % cover_name)

    audio_abs = os.path.join(dirpath, audio_name)
    cover_abs = os.path.join(dirpath, cover_name) if cover_name else None
    return audio_abs, cover_abs, warnings


def read_info(dirpath, dirname):
    """Read and validate info.json; return a dict (possibly empty)."""
    info_path = os.path.join(dirpath, "info.json")
    if not os.path.isfile(info_path):
        print("WARNING: no info.json in %s, using directory name as title" % dirname)
        return {}
    try:
        with open(info_path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        print("WARNING: invalid info.json in %s (%s)" % (dirname, exc))
        return {}
    if not isinstance(data, dict):
        print("WARNING: info.json in %s is not an object" % dirname)
        return {}
    return data


def sort_key(track):
    order = track["order"]
    return (order is None, order if order is not None else 0, track["title"].lower())


def main():
    mroot = music_root()
    if not os.path.isdir(mroot):
        print("Music directory not found: %s" % mroot)
        sys.exit(1)

    sroot = static_root()
    found_dirs = 0
    valid_tracks = []
    skipped = 0
    skipped_reasons = []

    for name in sorted(os.listdir(mroot)):
        dirpath = os.path.join(mroot, name)
        if not os.path.isdir(dirpath):
            continue
        if should_skip_dir(name):
            continue

        found_dirs += 1

        scanned = scan_directory(dirpath)
        if scanned is None:
            skipped += 1
            skipped_reasons.append("%s: no supported audio file" % name)
            continue

        audio_abs, cover_abs, warnings = scanned
        info = read_info(dirpath, name)

        for w in warnings:
            print("WARNING: %s: %s" % (name, w))

        title = info.get("title") or name
        artist = info.get("artist") or "Unknown Artist"
        album = info.get("album") or ""
        order = info.get("order")
        if not isinstance(order, (int, float)) or isinstance(order, bool):
            order = None

        track = {
            "id": name,
            "title": str(title),
            "artist": str(artist),
            "album": str(album),
            "audio": posix_rel(audio_abs, sroot),
            "cover": posix_rel(cover_abs, sroot) if cover_abs else "",
            "order": order,
        }
        valid_tracks.append(track)

    valid_tracks.sort(key=sort_key)

    seen_ids = set()
    seen_paths = set()
    for t in valid_tracks:
        if t["id"] in seen_ids:
            print("WARNING: duplicate id %r" % t["id"])
        seen_ids.add(t["id"])
        if t["audio"] in seen_paths:
            print("WARNING: duplicate audio path %r" % t["audio"])
        seen_paths.add(t["audio"])

    out_dir = os.path.join(project_root(), "data", "music")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "generated.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(valid_tracks, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print("Found %d track directories" % found_dirs)
    print("Generated %d valid tracks" % len(valid_tracks))
    print("Skipped %d invalid directory" % skipped)
    for reason in skipped_reasons:
        print("  - %s" % reason)
    print("Written %s" % out_path)


if __name__ == "__main__":
    main()
