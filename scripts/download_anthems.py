#!/usr/bin/env python3
"""
National Anthem Dataset Downloader

Downloads national anthem audio files from nationalanthems.info for current UN member states.
These files are licensed under CC BY 4.0 (Creative Commons Attribution 4.0 International).

About half of the MP3s on nationalanthems.info are converted from MIDI sequences created
by the site editors, making them safe to use under the CC BY 4.0 license.

Usage:
    python download_anthems.py

Output:
    - public/datasets/nationalAnthems.json - Metadata for all anthems
    - public/datasets/anthems/ - Directory containing downloaded MP3 files
"""

import base64
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# Base URLs
BASE_URL = "https://nationalanthems.info/"

# Current UN member states with their nationalanthems.info country codes
# Source: https://en.wikipedia.org/wiki/Member_states_of_the_United_Nations
UN_MEMBER_COUNTRIES = {
    "af": {"name": "Afghanistan", "iso": "AFG"},
    "al": {"name": "Albania", "iso": "ALB"},
    "dz": {"name": "Algeria", "iso": "DZA"},
    "ad": {"name": "Andorra", "iso": "AND"},
    "ao": {"name": "Angola", "iso": "AGO"},
    "ag": {"name": "Antigua and Barbuda", "iso": "ATG"},
    "ar": {"name": "Argentina", "iso": "ARG"},
    "am": {"name": "Armenia", "iso": "ARM"},
    "au": {"name": "Australia", "iso": "AUS"},
    "at": {"name": "Austria", "iso": "AUT"},
    "az": {"name": "Azerbaijan", "iso": "AZE"},
    "bs": {"name": "Bahamas", "iso": "BHS"},
    "bh": {"name": "Bahrain", "iso": "BHR"},
    "bd": {"name": "Bangladesh", "iso": "BGD"},
    "bb": {"name": "Barbados", "iso": "BRB"},
    "by": {"name": "Belarus", "iso": "BLR"},
    "be": {"name": "Belgium", "iso": "BEL"},
    "bz": {"name": "Belize", "iso": "BLZ"},
    "bj": {"name": "Benin", "iso": "BEN"},
    "bt": {"name": "Bhutan", "iso": "BTN"},
    "bo": {"name": "Bolivia", "iso": "BOL"},
    "ba": {"name": "Bosnia and Herzegovina", "iso": "BIH"},
    "bw": {"name": "Botswana", "iso": "BWA"},
    "br": {"name": "Brazil", "iso": "BRA"},
    "bn": {"name": "Brunei", "iso": "BRN"},
    "bg": {"name": "Bulgaria", "iso": "BGR"},
    "bf": {"name": "Burkina Faso", "iso": "BFA"},
    "bi": {"name": "Burundi", "iso": "BDI"},
    "cv": {"name": "Cabo Verde", "iso": "CPV"},
    "kh": {"name": "Cambodia", "iso": "KHM"},
    "cm": {"name": "Cameroon", "iso": "CMR"},
    "ca": {"name": "Canada", "iso": "CAN"},
    "cf": {"name": "Central African Republic", "iso": "CAF"},
    "td": {"name": "Chad", "iso": "TCD"},
    "cl": {"name": "Chile", "iso": "CHL"},
    "cn": {"name": "China", "iso": "CHN"},
    "co": {"name": "Colombia", "iso": "COL"},
    "km": {"name": "Comoros", "iso": "COM"},
    "cg": {"name": "Congo, Republic of", "iso": "COG"},
    "cd": {"name": "Congo, Democratic Republic of", "iso": "COD"},
    "cr": {"name": "Costa Rica", "iso": "CRI"},
    "ci": {"name": "Côte d'Ivoire", "iso": "CIV"},
    "hr": {"name": "Croatia", "iso": "HRV"},
    "cu": {"name": "Cuba", "iso": "CUB"},
    "cy": {"name": "Cyprus", "iso": "CYP"},
    "cz": {"name": "Czechia", "iso": "CZE"},
    "dk": {"name": "Denmark", "iso": "DNK"},
    "dj": {"name": "Djibouti", "iso": "DJI"},
    "dm": {"name": "Dominica", "iso": "DMA"},
    "do": {"name": "Dominican Republic", "iso": "DOM"},
    "ec": {"name": "Ecuador", "iso": "ECU"},
    "eg": {"name": "Egypt", "iso": "EGY"},
    "sv": {"name": "El Salvador", "iso": "SLV"},
    "gq": {"name": "Equatorial Guinea", "iso": "GNQ"},
    "er": {"name": "Eritrea", "iso": "ERI"},
    "ee": {"name": "Estonia", "iso": "EST"},
    "sz": {"name": "Eswatini", "iso": "SWZ"},
    "et": {"name": "Ethiopia", "iso": "ETH"},
    "fj": {"name": "Fiji", "iso": "FJI"},
    "fi": {"name": "Finland", "iso": "FIN"},
    "fr": {"name": "France", "iso": "FRA"},
    "ga": {"name": "Gabon", "iso": "GAB"},
    "gm": {"name": "Gambia", "iso": "GMB"},
    "ge": {"name": "Georgia", "iso": "GEO"},
    "de": {"name": "Germany", "iso": "DEU"},
    "gh": {"name": "Ghana", "iso": "GHA"},
    "gr": {"name": "Greece", "iso": "GRC"},
    "gd": {"name": "Grenada", "iso": "GRD"},
    "gt": {"name": "Guatemala", "iso": "GTM"},
    "gn": {"name": "Guinea", "iso": "GIN"},
    "gw": {"name": "Guinea-Bissau", "iso": "GNB"},
    "gy": {"name": "Guyana", "iso": "GUY"},
    "ht": {"name": "Haiti", "iso": "HTI"},
    "hn": {"name": "Honduras", "iso": "HND"},
    "hu": {"name": "Hungary", "iso": "HUN"},
    "is": {"name": "Iceland", "iso": "ISL"},
    "in": {"name": "India", "iso": "IND"},
    "id": {"name": "Indonesia", "iso": "IDN"},
    "ir": {"name": "Iran", "iso": "IRN"},
    "iq": {"name": "Iraq", "iso": "IRQ"},
    "ie": {"name": "Ireland", "iso": "IRL"},
    "il": {"name": "Israel", "iso": "ISR"},
    "it": {"name": "Italy", "iso": "ITA"},
    "jm": {"name": "Jamaica", "iso": "JAM"},
    "jp": {"name": "Japan", "iso": "JPN"},
    "jo": {"name": "Jordan", "iso": "JOR"},
    "kz": {"name": "Kazakhstan", "iso": "KAZ"},
    "ke": {"name": "Kenya", "iso": "KEN"},
    "ki": {"name": "Kiribati", "iso": "KIR"},
    "kp": {"name": "North Korea", "iso": "PRK"},
    "kr": {"name": "South Korea", "iso": "KOR"},
    "kw": {"name": "Kuwait", "iso": "KWT"},
    "kg": {"name": "Kyrgyzstan", "iso": "KGZ"},
    "la": {"name": "Laos", "iso": "LAO"},
    "lv": {"name": "Latvia", "iso": "LVA"},
    "lb": {"name": "Lebanon", "iso": "LBN"},
    "ls": {"name": "Lesotho", "iso": "LSO"},
    "lr": {"name": "Liberia", "iso": "LBR"},
    "ly": {"name": "Libya", "iso": "LBY"},
    "li": {"name": "Liechtenstein", "iso": "LIE"},
    "lt": {"name": "Lithuania", "iso": "LTU"},
    "lu": {"name": "Luxembourg", "iso": "LUX"},
    "mg": {"name": "Madagascar", "iso": "MDG"},
    "mw": {"name": "Malawi", "iso": "MWI"},
    "my": {"name": "Malaysia", "iso": "MYS"},
    "mv": {"name": "Maldives", "iso": "MDV"},
    "ml": {"name": "Mali", "iso": "MLI"},
    "mt": {"name": "Malta", "iso": "MLT"},
    "mh": {"name": "Marshall Islands", "iso": "MHL"},
    "mr": {"name": "Mauritania", "iso": "MRT"},
    "mu": {"name": "Mauritius", "iso": "MUS"},
    "mx": {"name": "Mexico", "iso": "MEX"},
    "fm": {"name": "Micronesia", "iso": "FSM"},
    "md": {"name": "Moldova", "iso": "MDA"},
    "mc": {"name": "Monaco", "iso": "MCO"},
    "mn": {"name": "Mongolia", "iso": "MNG"},
    "me": {"name": "Montenegro", "iso": "MNE"},
    "ma": {"name": "Morocco", "iso": "MAR"},
    "mz": {"name": "Mozambique", "iso": "MOZ"},
    "mm": {"name": "Myanmar", "iso": "MMR"},
    "na": {"name": "Namibia", "iso": "NAM"},
    "nr": {"name": "Nauru", "iso": "NRU"},
    "np": {"name": "Nepal", "iso": "NPL"},
    "nl": {"name": "Netherlands", "iso": "NLD"},
    "nz": {"name": "New Zealand", "iso": "NZL"},
    "ni": {"name": "Nicaragua", "iso": "NIC"},
    "ne": {"name": "Niger", "iso": "NER"},
    "ng": {"name": "Nigeria", "iso": "NGA"},
    "mk": {"name": "North Macedonia", "iso": "MKD"},
    "no": {"name": "Norway", "iso": "NOR"},
    "om": {"name": "Oman", "iso": "OMN"},
    "pk": {"name": "Pakistan", "iso": "PAK"},
    "pw": {"name": "Palau", "iso": "PLW"},
    "pa": {"name": "Panama", "iso": "PAN"},
    "pg": {"name": "Papua New Guinea", "iso": "PNG"},
    "py": {"name": "Paraguay", "iso": "PRY"},
    "pe": {"name": "Peru", "iso": "PER"},
    "ph": {"name": "Philippines", "iso": "PHL"},
    "pl": {"name": "Poland", "iso": "POL"},
    "pt": {"name": "Portugal", "iso": "PRT"},
    "qa": {"name": "Qatar", "iso": "QAT"},
    "ro": {"name": "Romania", "iso": "ROU"},
    "ru": {"name": "Russia", "iso": "RUS"},
    "rw": {"name": "Rwanda", "iso": "RWA"},
    "kn": {"name": "Saint Kitts and Nevis", "iso": "KNA"},
    "lc": {"name": "Saint Lucia", "iso": "LCA"},
    "vc": {"name": "Saint Vincent and the Grenadines", "iso": "VCT"},
    "ws": {"name": "Samoa", "iso": "WSM"},
    "sm": {"name": "San Marino", "iso": "SMR"},
    "st": {"name": "Sao Tome and Principe", "iso": "STP"},
    "sa": {"name": "Saudi Arabia", "iso": "SAU"},
    "sn": {"name": "Senegal", "iso": "SEN"},
    "rs": {"name": "Serbia", "iso": "SRB"},
    "sc": {"name": "Seychelles", "iso": "SYC"},
    "sl": {"name": "Sierra Leone", "iso": "SLE"},
    "sg": {"name": "Singapore", "iso": "SGP"},
    "sk": {"name": "Slovakia", "iso": "SVK"},
    "si": {"name": "Slovenia", "iso": "SVN"},
    "sb": {"name": "Solomon Islands", "iso": "SLB"},
    "so": {"name": "Somalia", "iso": "SOM"},
    "za": {"name": "South Africa", "iso": "ZAF"},
    "ss": {"name": "South Sudan", "iso": "SSD"},
    "es": {"name": "Spain", "iso": "ESP"},
    "lk": {"name": "Sri Lanka", "iso": "LKA"},
    "sd": {"name": "Sudan", "iso": "SDN"},
    "sr": {"name": "Suriname", "iso": "SUR"},
    "se": {"name": "Sweden", "iso": "SWE"},
    "ch": {"name": "Switzerland", "iso": "CHE"},
    "sy": {"name": "Syria", "iso": "SYR"},
    "tj": {"name": "Tajikistan", "iso": "TJK"},
    "tz": {"name": "Tanzania", "iso": "TZA"},
    "th": {"name": "Thailand", "iso": "THA"},
    "tl": {"name": "Timor-Leste", "iso": "TLS"},
    "tg": {"name": "Togo", "iso": "TGO"},
    "to": {"name": "Tonga", "iso": "TON"},
    "tt": {"name": "Trinidad and Tobago", "iso": "TTO"},
    "tn": {"name": "Tunisia", "iso": "TUN"},
    "tr": {"name": "Turkey", "iso": "TUR"},
    "tm": {"name": "Turkmenistan", "iso": "TKM"},
    "tv": {"name": "Tuvalu", "iso": "TUV"},
    "ug": {"name": "Uganda", "iso": "UGA"},
    "ua": {"name": "Ukraine", "iso": "UKR"},
    "ae": {"name": "United Arab Emirates", "iso": "ARE"},
    "gb": {"name": "United Kingdom", "iso": "GBR"},
    "us": {"name": "United States", "iso": "USA"},
    "uy": {"name": "Uruguay", "iso": "URY"},
    "uz": {"name": "Uzbekistan", "iso": "UZB"},
    "vu": {"name": "Vanuatu", "iso": "VUT"},
    "va": {"name": "Vatican City", "iso": "VAT"},
    "ve": {"name": "Venezuela", "iso": "VEN"},
    "vn": {"name": "Vietnam", "iso": "VNM"},
    "ye": {"name": "Yemen", "iso": "YEM"},
    "zm": {"name": "Zambia", "iso": "ZMB"},
    "zw": {"name": "Zimbabwe", "iso": "ZWE"},
}

# Output paths
SCRIPT_DIR = Path(__file__).parent.parent
DATASET_DIR = SCRIPT_DIR / "public" / "datasets"
ANTHEMS_DIR = DATASET_DIR / "anthems"
OUTPUT_JSON = DATASET_DIR / "nationalAnthems.json"


def get_session():
    """Create a requests session with appropriate headers."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; EnigmaPuzzleBot/1.0; +https://github.com/enigma)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return session


def fetch_anthem_page(session, country_code):
    """Fetch the anthem page for a country and extract download info."""
    url = f"{BASE_URL}{country_code}.htm"

    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  Error fetching {url}: {e}")
        return None

    soup = BeautifulSoup(response.content, "html.parser")
    page_text = response.text

    # Extract MP3 path from base64-encoded JavaScript
    # Pattern: mp3: "BASE64_ENCODED_PATH"
    download_url = None
    mp3_match = re.search(r'mp3:\s*"([A-Za-z0-9+/=]+)"', page_text)
    if mp3_match:
        try:
            encoded = mp3_match.group(1)
            decoded_path = base64.b64decode(encoded).decode('utf-8')
            # The path is relative like "/us.mp3"
            download_url = urljoin(BASE_URL, decoded_path)
        except Exception:
            pass

    # Fallback: try direct URL pattern
    if not download_url:
        # Try the simple pattern first
        test_url = f"{BASE_URL}{country_code}.mp3"
        try:
            head_resp = session.head(test_url, timeout=10)
            if head_resp.status_code == 200:
                download_url = test_url
        except Exception:
            pass

    # Try to extract anthem title
    title = None
    title_tag = soup.find("h2")
    if title_tag:
        title = title_tag.get_text(strip=True)

    # Check for copyright notice (indicates restricted file)
    has_copyright_restriction = "©" in page_text and "all rights reserved" in page_text.lower()

    # Check if download is enabled in player config
    download_enabled = 'download:true' in page_text or 'download: true' in page_text

    # Check if it mentions MIDI source (safer license)
    is_midi_source = "midi" in page_text.lower()

    return {
        "download_url": download_url,
        "title": title,
        "page_url": url,
        "has_copyright_restriction": has_copyright_restriction,
        "download_enabled": download_enabled,
        "is_midi_source": is_midi_source,
    }


def download_file(session, url, output_path):
    """Download a file from URL to output path."""
    try:
        response = session.get(url, timeout=60, stream=True)
        response.raise_for_status()

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return True
    except requests.RequestException as e:
        print(f"  Error downloading {url}: {e}")
        return False


def main():
    """Main function to download all anthems and create dataset."""
    print("National Anthem Dataset Downloader")
    print("=" * 50)
    print(f"License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)")
    print(f"Source: nationalanthems.info")
    print(f"Total countries: {len(UN_MEMBER_COUNTRIES)}")
    print("=" * 50)

    # Create output directories
    ANTHEMS_DIR.mkdir(parents=True, exist_ok=True)

    session = get_session()
    dataset = {
        "metadata": {
            "source": "nationalanthems.info",
            "license": "CC BY 4.0",
            "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "attribution": "National Anthems - nationalanthems.info",
            "downloadDate": time.strftime("%Y-%m-%d"),
            "note": "Many of these files are MIDI-to-MP3 conversions created by the site editors."
        },
        "anthems": []
    }

    successful = 0
    skipped_copyright = 0
    failed = 0

    for code, info in sorted(UN_MEMBER_COUNTRIES.items()):
        country_name = info["name"]
        iso_code = info["iso"]

        print(f"\n[{successful + skipped_copyright + failed + 1}/{len(UN_MEMBER_COUNTRIES)}] {country_name} ({code})...")

        # Fetch page info
        page_info = fetch_anthem_page(session, code)

        if not page_info:
            print(f"  ✗ Failed to fetch page")
            failed += 1
            continue

        if not page_info["download_url"]:
            print(f"  ✗ No download link found")
            failed += 1
            continue

        # Skip files with explicit copyright restrictions
        if page_info["has_copyright_restriction"]:
            print(f"  ⚠ Skipped (copyright restricted)")
            skipped_copyright += 1
            continue

        # Download the file
        filename = f"{iso_code.lower()}.mp3"
        output_path = ANTHEMS_DIR / filename

        if output_path.exists():
            print(f"  ✓ Already downloaded")
        else:
            print(f"  Downloading {page_info['download_url']}...")
            if not download_file(session, page_info["download_url"], output_path):
                failed += 1
                continue
            print(f"  ✓ Downloaded")

        # Get file size
        file_size = output_path.stat().st_size if output_path.exists() else 0

        # Add to dataset
        dataset["anthems"].append({
            "countryCode": code,
            "countryName": country_name,
            "isoCode": iso_code,
            "title": page_info["title"],
            "filename": filename,
            "fileSize": file_size,
            "sourceUrl": page_info["page_url"],
            "isMidiSource": page_info["is_midi_source"],
        })

        successful += 1

        # Be nice to the server
        time.sleep(0.5)

    # Write dataset JSON
    print(f"\n{'=' * 50}")
    print("Writing dataset JSON...")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Dataset saved to {OUTPUT_JSON}")
    print(f"✓ Audio files saved to {ANTHEMS_DIR}/")
    print(f"\nSummary:")
    print(f"  Successful: {successful}")
    print(f"  Skipped (copyright): {skipped_copyright}")
    print(f"  Failed: {failed}")
    print(f"  Total: {successful + skipped_copyright + failed}")


if __name__ == "__main__":
    main()
