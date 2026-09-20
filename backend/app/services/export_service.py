import io
import csv
import json
from typing import List, Dict, Any
import pandas as pd

class ExportService:
    @staticmethod
    def to_csv(leads: List[Dict[str, Any]]) -> str:
        if not leads:
            return ""
        output = io.StringIO()
        keys = leads[0].keys()
        writer = csv.DictWriter(output, fieldnames=keys)
        writer.writeheader()
        writer.writerows(leads)
        return output.getvalue()

    @staticmethod
    def to_json(leads: List[Dict[str, Any]]) -> str:
        return json.dumps(leads, default=str, indent=2)

    @staticmethod
    def to_excel(leads: List[Dict[str, Any]]) -> bytes:
        if not leads:
            return b""
        df = pd.DataFrame(leads)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Leads")
        return output.getvalue()

export_service = ExportService()
