from __future__ import annotations

import hashlib
from typing import Any

try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
except ImportError as exc:
    raise ImportError(
        "Presidio libraries not found. Install PHI scrubbing support with:\n"
        "  pip install medtrace-sdk[phi]"
    ) from exc

# Entity types relevant to healthcare PHI
MEDICAL_ENTITIES: list[str] = [
    "PERSON",
    "PHONE_NUMBER",
    "EMAIL_ADDRESS",
    "US_SSN",
    "DATE_TIME",
    "LOCATION",
    "US_DRIVER_LICENSE",
    "MEDICAL_LICENSE",
    "IP_ADDRESS",
    "URL",
    "IBAN_CODE",
    "CREDIT_CARD",
]


class PhiScrubber:
    def __init__(self, mode: str = "mask") -> None:
        assert mode in ("mask", "hash"), f"Unsupported mode: {mode}"
        self.mode = mode
        self.analyzer = AnalyzerEngine()
        self.anonymizer = AnonymizerEngine()

    # --- core text scrubbing ---
    def scrub_text(self, text: str) -> tuple[str, int]:
        results = self.analyzer.analyze(
            text=text,
            entities=MEDICAL_ENTITIES,
            language="en",
        )
        count = len(results)
        if count == 0:
            return text, 0

        if self.mode == "hash":
            operators = {
                ent: OperatorConfig(
                    "custom",
                    {"lambda": lambda x: hashlib.sha256(x.encode()).hexdigest()},
                )
                for ent in MEDICAL_ENTITIES
            }
        else:  # mask
            operators = {
                ent: OperatorConfig("replace", {"new_value": "[PHI_REDACTED]"})
                for ent in MEDICAL_ENTITIES
            }

        anonymized = self.anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators,
        )
        return anonymized.text, count

    # --- recursive dict scrubbing ---
    def scrub_dict(self, payload: dict[str, Any]) -> tuple[dict[str, Any], int]:
        total_count = 0
        scrubbed: dict[str, Any] = {}
        for key, value in payload.items():
            if isinstance(value, str):
                clean, n = self.scrub_text(value)
                scrubbed[key] = clean
                total_count += n
            elif isinstance(value, dict):
                clean, n = self.scrub_dict(value)
                scrubbed[key] = clean
                total_count += n
            elif isinstance(value, list):
                clean_list: list[Any] = []
                for item in value:
                    if isinstance(item, str):
                        clean, n = self.scrub_text(item)
                        clean_list.append(clean)
                        total_count += n
                    elif isinstance(item, dict):
                        clean, n = self.scrub_dict(item)
                        clean_list.append(clean)
                        total_count += n
                    else:
                        clean_list.append(item)
                scrubbed[key] = clean_list
            else:
                scrubbed[key] = value
        return scrubbed, total_count


# Module-level default instance
default_scrubber = PhiScrubber()
